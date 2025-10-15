import type { ObjectMetadata } from '@/client/types/internal';
import { withRetries } from './retry';

export async function uploadFileToS3(params: {
  signedUrl: string;
  file: File;
  objectMetadata: ObjectMetadata;
  objectCacheControl?: string;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
  retry?: number;
  retryDelay?: number;
}) {
  const xhr = new XMLHttpRequest();

  await withRetries(
    () =>
      new Promise<void>((resolve, reject) => {
        const abortHandler = createAbortHandler(xhr, reject);

        if (params.signal?.aborted) {
          abortHandler();
        }

        params.signal?.addEventListener('abort', abortHandler);

        xhr.onloadend = () => {
          params.signal?.removeEventListener('abort', abortHandler);

          if (xhr.readyState === 4 && xhr.status === 200) {
            params.onProgress?.(1);

            resolve();
          } else {
            reject(new Error('Failed to upload file to S3.'));
          }
        };

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            params.onProgress?.(Math.min(event.loaded / event.total, 0.99));
          }
        };

        xhr.open('PUT', params.signedUrl, true);
        xhr.setRequestHeader('Content-Type', params.file.type);

        if (params.objectCacheControl) {
          xhr.setRequestHeader('Cache-Control', params.objectCacheControl);
        }

        Object.entries(params.objectMetadata).forEach(([key, value]) => {
          xhr.setRequestHeader(`x-amz-meta-${key}`, value);
        });

        xhr.send(params.file);
      }),
    {
      retry: params.retry,
      delay: params.retryDelay,
      signal: params.signal,
      abortHandler: () => {
        xhr.abort();
        throw new Error('Upload aborted.');
      },
    }
  );
}

export async function uploadMultipartFileToS3(params: {
  file: File;
  parts: { signedUrl: string; partNumber: number; size: number }[];
  partSize: number;
  uploadId: string;
  completeSignedUrl: string;
  partsBatchSize?: number;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
  retry?: number;
  retryDelay?: number;
}) {
  const uploadedParts: { etag: string; number: number }[] = [];
  const progresses: { [part: number]: number } = {};

  const uploadPromises = params.parts.map((part) => async () => {
    const xhr = new XMLHttpRequest();

    const start = (part.partNumber - 1) * params.partSize;
    const end = Math.min(start + part.size, params.file.size);
    const blob = params.file.slice(start, end);

    await withRetries(
      () =>
        new Promise<void>((resolve, reject) => {
          const abortHandler = createAbortHandler(xhr, reject);

          if (params.signal?.aborted) {
            abortHandler();
          }

          params.signal?.addEventListener('abort', abortHandler);

          xhr.onloadend = () => {
            params.signal?.removeEventListener('abort', abortHandler);

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
        }),
      {
        retry: params.retry,
        delay: params.retryDelay,
        signal: params.signal,
        abortHandler: () => {
          xhr.abort();
          throw new Error('Upload aborted.');
        },
      }
    );
  });

  const batchSize = params.partsBatchSize || uploadPromises.length;
  for (let i = 0; i < uploadPromises.length; i += batchSize) {
    await Promise.all(uploadPromises.slice(i, i + batchSize).map((fn) => fn()));
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

  const completeRes = await withRetries(
    () =>
      fetch(params.completeSignedUrl, {
        method: 'POST',
        body: completeXmlBody,
        headers: {
          'Content-Type': 'application/xml',
        },
        signal: params.signal,
      }),
    {
      retry: params.retry,
      delay: params.retryDelay,
      signal: params.signal,
    }
  );

  if (!completeRes.ok) {
    throw new Error('Failed to complete multipart upload.');
  }

  params.onProgress?.(1);
}

function createAbortHandler(
  xhr: XMLHttpRequest,
  reject: (reason?: any) => void
) {
  return () => {
    xhr.abort();
    reject(new Error('Upload aborted.'));
  };
}
