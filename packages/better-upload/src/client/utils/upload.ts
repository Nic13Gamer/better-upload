import { UploadFilesError } from '../types/error';
import type { UploadRouterSuccessResponse } from '../types/internal';
import type { UploadedFile } from '../types/public';

export async function uploadFiles(params: {
  api: string;
  route: string;
  files: File[];
  metadata?: Record<string, unknown>;

  sequential?: boolean;
  abortOnS3UploadError?: boolean;
  multipartBatchSize?: number;

  onBegin?: (data: {
    files: UploadedFile[];
    metadata: Record<string, unknown | undefined>;
  }) => void;
  onProgress?: (data: {
    file: Omit<UploadedFile, 'raw'>;
    progress: number;
  }) => void;
}) {
  try {
    const signedUrlRes = await fetch(params.api, {
      method: 'POST',
      body: JSON.stringify({
        route: params.route,
        metadata: params.metadata,
        files: params.files.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
        })),
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!signedUrlRes.ok) {
      const { error } = (await signedUrlRes.json()) as any;

      throw new UploadFilesError({
        type: error.type || 'unknown',
        message: error.message || '',
      });
    }

    const payload = (await signedUrlRes.json()) as UploadRouterSuccessResponse;

    const signedUrls =
      'multipart' in payload ? payload.multipart.files : payload.files;
    const serverMetadata = payload.metadata;

    const partSize = 'multipart' in payload ? payload.multipart.partSize : 0;

    if (!signedUrls || signedUrls.length === 0) {
      throw new UploadFilesError({
        type: 'unknown',
        message:
          'No pre-signed URLs returned. Check your upload router config.',
      });
    }

    signedUrls.forEach((url) => {
      params.onProgress?.({
        file: url.file,
        progress: 0,
      });
    });

    const uploadedFiles: UploadedFile[] = [];

    const uploadPromises = params.files.map((file) => async () => {
      const data = signedUrls.find(
        (url) =>
          url.file.name === file.name &&
          url.file.size === file.size &&
          url.file.type === file.type
      )!;

      const multipart = 'parts' in data;

      try {
        if (multipart) {
          await uploadMultipartFileToS3({
            file,
            parts: data.parts,
            partSize,
            uploadId: data.uploadId,
            completeSignedUrl: data.completeSignedUrl,
            partsBatchSize: params.multipartBatchSize,

            onProgress: (progress) =>
              params.onProgress?.({
                file: data.file,
                progress,
              }),
          });
        } else {
          await uploadFileToS3({
            file,
            signedUrl: data.signedUrl,

            onProgress: (progress) =>
              params.onProgress?.({
                file: data.file,
                progress,
              }),
          });
        }

        uploadedFiles.push({
          raw: file,
          name: data.file.name,
          size: data.file.size,
          type: data.file.type,
          objectKey: data.file.objectKey,
        });
      } catch (error) {
        if (multipart) {
          await fetch(data.abortSignedUrl, {
            method: 'DELETE',
          }).catch(() => {});
        }

        if (params.abortOnS3UploadError) {
          throw new UploadFilesError({
            type: 's3_upload',
            message: `Failed to upload file ${file.name} to S3.`,
            objectKeys: signedUrls.map((url) => url.file.objectKey),
          });
        }
      }
    });

    params.onBegin?.({
      files: params.files.map((file) => ({
        raw: file,
        ...signedUrls.find(
          (url) =>
            url.file.name === file.name &&
            url.file.size === file.size &&
            url.file.type === file.type
        )!.file,
      })),
      metadata: serverMetadata,
    });

    if (params.sequential) {
      for (const uploadPromise of uploadPromises) {
        await uploadPromise();
      }
    } else {
      await Promise.all(uploadPromises.map((promise) => promise()));
    }

    return {
      uploadedFiles,
      serverMetadata,
    };
  } catch (error) {
    if (error instanceof UploadFilesError) {
      throw error;
    }

    throw new UploadFilesError({
      type: 'unknown',
      message: 'Failed to upload files.',
    });
  }
}

async function uploadFileToS3(params: {
  signedUrl: string;
  file: File;
  onProgress?: (progress: number) => void;
}) {
  const xhr = new XMLHttpRequest();

  await new Promise<void>((resolve, reject) => {
    xhr.onloadend = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        resolve();
      } else {
        reject(new Error('Failed to upload file to S3.'));
      }
    };

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        params.onProgress?.(event.loaded / event.total);
      }
    };

    xhr.open('PUT', params.signedUrl, true);
    xhr.setRequestHeader('Content-Type', params.file.type);

    xhr.send(params.file);
  });
}

async function uploadMultipartFileToS3(params: {
  file: File;
  parts: { signedUrl: string; partNumber: number; size: number }[];
  partSize: number;
  uploadId: string;
  completeSignedUrl: string;
  partsBatchSize?: number;
  onProgress?: (progress: number) => void;
}) {
  const uploadedParts: { etag: string; number: number }[] = [];
  const progresses: { [part: number]: number } = {};

  const uploadPromises = params.parts.map((part) => async () => {
    const xhr = new XMLHttpRequest();

    const start = (part.partNumber - 1) * params.partSize;
    const end = Math.min(start + part.size, params.file.size);
    const blob = params.file.slice(start, end);

    await new Promise<void>((resolve, reject) => {
      xhr.onloadend = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
          uploadedParts.push({
            etag: xhr.getResponseHeader('ETag')!.replace(/"/g, ''),
            number: part.partNumber,
          });

          resolve();
        } else {
          reject(new Error('Failed to upload part to S3.'));
        }
      };

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          progresses[part.partNumber] = event.loaded / event.total;

          const totalProgress =
            Object.values(progresses).reduce((acc, curr) => acc + curr, 0) /
            params.parts.length;

          params.onProgress?.(Math.min(totalProgress, 0.99));
        }
      };

      xhr.open('PUT', part.signedUrl, true);

      xhr.send(blob);
    });
  });

  const batchSize = params.partsBatchSize || uploadPromises.length;

  for (let i = 0; i < uploadPromises.length; i += batchSize) {
    await Promise.all(
      uploadPromises.slice(i, i + batchSize).map((promise) => promise())
    );
  }

  const completeXmlBody = `
<CompleteMultipartUpload>
  ${uploadedParts
    .sort((a, b) => a.number - b.number)
    .map(
      (part) => `<Part>
    <ETag>${part.etag}</ETag>
    <PartNumber>${part.number}</PartNumber>
  </Part>`
    )
    .join('')}
</CompleteMultipartUpload>
  `;

  const completeRes = await fetch(params.completeSignedUrl, {
    method: 'POST',
    body: completeXmlBody,
    headers: {
      'Content-Type': 'application/xml',
    },
  });

  params.onProgress?.(1);

  if (!completeRes.ok) {
    throw new Error('Failed to complete multipart upload.');
  }
}
