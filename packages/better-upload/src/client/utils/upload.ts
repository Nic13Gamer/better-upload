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

  onUploadBegin?: (data: {
    files: UploadedFile[];
    metadata: Record<string, unknown | undefined>;
  }) => void;
  onUploadProgress?: (data: {
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

    const { files: signedUrls, metadata: serverMetadata } =
      (await signedUrlRes.json()) as UploadRouterSuccessResponse;

    if (!signedUrls) {
      throw new UploadFilesError({
        type: 'unknown',
        message:
          'No pre-signed URLs returned. Check your upload router config.',
      });
    }

    const uploadedFiles: UploadedFile[] = [];

    const uploadPromises = params.files.map(async (file) => {
      const data = signedUrls.find(
        (url) =>
          url.file.name === file.name &&
          url.file.size === file.size &&
          url.file.type === file.type
      )!;

      try {
        await uploadFileToS3({
          file,
          signedUrl: data.signedUrl,

          onProgress: (progress) =>
            params.onUploadProgress?.({
              file: data.file,
              progress,
            }),
        });
      } catch (error) {
        if (params.abortOnS3UploadError) {
          throw new UploadFilesError({
            type: 'unknown',
            message: `Failed to upload file ${file.name} to S3.`,
          });
        }
      }

      uploadedFiles.push({
        raw: file,
        name: data.file.name,
        size: data.file.size,
        type: data.file.type,
        objectKey: data.file.objectKey,
      });
    });

    params.onUploadBegin?.({
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
        await uploadPromise;
      }
    } else {
      await Promise.all(uploadPromises);
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
    xhr.addEventListener('loadend', () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        resolve();
      } else {
        reject(new Error('Failed to upload file to S3.'));
      }
    });

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        params.onProgress?.(event.loaded / event.total);
      }
    };

    xhr.open('PUT', params.signedUrl + 'asd', true);
    xhr.setRequestHeader('Content-Type', params.file.type);

    xhr.send(params.file);
  });
}
