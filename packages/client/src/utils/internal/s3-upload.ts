import type { ObjectMetadata, PostFormData } from '@/types/internal';
import { withRetries } from './retry';

/**
 * Uploads a file to S3 using a signed URL with the PUT method.
 * This function handles single-part uploads and includes progress tracking and retry logic.
 *
 * @param params - Upload configuration object
 * @param params.signedUrl - The pre-signed URL for uploading the file
 * @param params.file - The file to upload
 * @param params.objectMetadata - Custom metadata to attach to the S3 object
 * @param params.objectCacheControl - Optional cache control header for the S3 object
 * @param params.onProgress - Optional progress callback that receives a value between 0 and 1
 * @param params.signal - Optional abort signal to cancel the upload
 * @param params.retry - Number of retry attempts for failed uploads
 * @param params.retryDelay - Delay in milliseconds between retry attempts
 *
 * @throws {Error} When the upload fails or is aborted
 */
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

/**
 * Uploads a file to S3 using a POST request with form data.
 * This method is an alternative to PUT uploads and is useful when PUT requests are restricted.
 * The form data includes all necessary fields and policies required by S3.
 *
 * @param params - Upload configuration object
 * @param params.postForm - The form data containing URL and fields for the POST request
 * @param params.file - The file to upload
 * @param params.onProgress - Optional progress callback that receives a value between 0 and 1
 * @param params.signal - Optional abort signal to cancel the upload
 * @param params.retry - Number of retry attempts for failed uploads
 * @param params.retryDelay - Delay in milliseconds between retry attempts
 *
 * @throws {Error} When the upload fails or is aborted
 */
export async function uploadFileToS3Post(params: {
  postForm: PostFormData;
  file: File;
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

          if (
            xhr.readyState === 4 &&
            (xhr.status === 200 || xhr.status === 204)
          ) {
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

        xhr.open('POST', params.postForm.url, true);

        // Create FormData with all the required fields
        const formData = new FormData();

        // Add all form fields first (order matters for S3)
        Object.entries(params.postForm.fields).forEach(([key, value]) => {
          formData.append(key, value);
        });

        // Add the file last
        formData.append('file', params.file);

        xhr.send(formData);
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

/**
 * Uploads a large file to S3 using multipart upload for improved performance and reliability.
 * The file is split into multiple parts that are uploaded in parallel, then combined by S3.
 * This method is essential for large files and provides better error recovery and progress tracking.
 *
 * @param params - Multipart upload configuration object
 * @param params.file - The file to upload
 * @param params.parts - Array of parts with signed URLs, part numbers, and sizes
 * @param params.partSize - Size in bytes of each part (except the last part which may be smaller)
 * @param params.uploadId - Unique identifier for this multipart upload session
 * @param params.completeSignedUrl - Signed URL to complete the multipart upload
 * @param params.partsBatchSize - Optional number of parts to upload simultaneously (defaults to all parts)
 * @param params.onProgress - Optional progress callback that receives a value between 0 and 1
 * @param params.signal - Optional abort signal to cancel the upload
 * @param params.retry - Number of retry attempts for failed part uploads
 * @param params.retryDelay - Delay in milliseconds between retry attempts
 *
 * @throws {Error} When part uploads fail, completion fails, or upload is aborted
 */
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
