import { ClientUploadErrorClass } from '@/types/error';
import type {
  DirectUploadResult,
  ServerMetadata,
  SignedUrlsSuccessResponse,
} from '@/types/internal';
import type { FileUploadInfo, UploadStatus } from '@/types/public';
import { withRetries } from './internal/retry';
import {
  uploadFileToS3,
  uploadFileToS3Post,
  uploadMultipartFileToS3,
} from './internal/s3-upload';

/**
 * Upload multiple files to S3.
 *
 * This function handles the complete upload process: requesting signed URLs from your server,
 * uploading files to S3 (supporting both single-part and multipart uploads), and tracking
 * progress for each file. Failed uploads are returned separately without throwing errors.
 *
 * @param params - Upload configuration object
 * @param params.api - API endpoint for requesting signed URLs (default: '/api/upload')
 * @param params.route - Upload route name that matches your server configuration
 * @param params.files - Array of files or FileList to upload
 * @param params.metadata - Optional metadata to send to your server
 * @param params.multipartBatchSize - Number of parts to upload simultaneously in multipart uploads
 * @param params.uploadBatchSize - Number of files to upload simultaneously (default: all files)
 * @param params.signal - AbortSignal to cancel the upload operation
 * @param params.headers - Additional headers to send when requesting signed URLs
 * @param params.credentials - Credentials mode for the signed URL request
 * @param params.retry - Number of retry attempts for failed operations
 * @param params.retryDelay - Delay in milliseconds between retry attempts
 * @param params.onUploadBegin - Callback fired when uploads begin with file info and server metadata
 * @param params.onFileStateChange - Callback fired when any file's upload state changes
 *
 * @returns Promise resolving to upload results with successful files, failed files, and server metadata
 *
 * @throws {ClientUploadErrorClass} When no files are provided, server errors occur, or upload is aborted
 */
export async function uploadFiles(params: {
  api?: string;
  route: string;
  files: File[] | FileList;
  metadata?: ServerMetadata;
  multipartBatchSize?: number;
  uploadBatchSize?: number;
  signal?: AbortSignal;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
  retry?: number;
  retryDelay?: number;

  onUploadBegin?: (data: {
    files: FileUploadInfo<'pending'>[];
    metadata: ServerMetadata;
  }) => void;
  onFileStateChange?: (data: { file: FileUploadInfo<UploadStatus> }) => void;
}): Promise<DirectUploadResult<true>> {
  const files = Array.from(params.files);

  if (files.length === 0) {
    throw new ClientUploadErrorClass({
      type: 'no_files',
      message: 'No files to upload.',
    });
  }

  try {
    const headers = new Headers(params.headers);
    headers.set('Content-Type', 'application/json');

    const signedUrlRes = await withRetries(
      () =>
        fetch(params.api || '/api/upload', {
          method: 'POST',
          body: JSON.stringify({
            route: params.route,
            metadata: params.metadata,
            files: files.map((file) => ({
              name: file.name,
              size: file.size,
              type: file.type,
            })),
          }),
          headers,
          credentials: params.credentials,
          signal: params.signal,
        }),
      { retry: params.retry, delay: params.retryDelay, signal: params.signal }
    );

    if (!signedUrlRes.ok) {
      const { error } = (await signedUrlRes.json()) as any;

      throw new ClientUploadErrorClass({
        type: error.type || 'unknown',
        message: error.message || 'Failed to obtain pre-signed URLs.',
      });
    }

    const payload = (await signedUrlRes.json()) as SignedUrlsSuccessResponse;

    const signedUrls =
      'multipart' in payload ? payload.multipart.files : payload.files;
    const serverMetadata = payload.metadata;
    const partSize = 'multipart' in payload ? payload.multipart.partSize : 0;

    if (!signedUrls || signedUrls.length === 0) {
      throw new ClientUploadErrorClass({
        type: 'unknown',
        message:
          'No pre-signed URLs returned from server. Check your upload router config.',
      });
    }

    const uploads = new Map<string, FileUploadInfo<UploadStatus>>(
      signedUrls.map((url) => [
        url.file.objectInfo.key,
        {
          status: 'pending',
          progress: 0,
          raw: files.find(
            (file) =>
              file.name === url.file.name &&
              file.size === url.file.size &&
              file.type === url.file.type
          )!,
          ...url.file,
        },
      ])
    );

    const uploadPromises = files.map((file) => async () => {
      const url = signedUrls.find(
        (item) =>
          item.file.name === file.name &&
          item.file.size === file.size &&
          item.file.type === file.type
      )!;

      const isMultipart = 'parts' in url;

      try {
        uploads.set(url.file.objectInfo.key, {
          ...uploads.get(url.file.objectInfo.key)!,
          status: 'uploading',
          progress: 0,
        });

        params.onFileStateChange?.({
          file: uploads.get(url.file.objectInfo.key)!,
        });

        if (isMultipart) {
          await uploadMultipartFileToS3({
            file,
            parts: url.parts,
            partSize,
            uploadId: url.uploadId,
            completeSignedUrl: url.completeSignedUrl,
            partsBatchSize: params.multipartBatchSize,
            signal: params.signal,
            retry: params.retry,
            retryDelay: params.retryDelay,
            onProgress: (progress) => {
              if (uploads.get(url.file.objectInfo.key)!.status === 'failed') {
                return;
              }

              uploads.set(url.file.objectInfo.key, {
                ...uploads.get(url.file.objectInfo.key)!,
                status: progress === 1 ? 'complete' : 'uploading',
                progress,
              });

              params.onFileStateChange?.({
                file: uploads.get(url.file.objectInfo.key)!,
              });
            },
          });
        } else {
          // Handle both PUT and POST upload methods
          if (payload.method === 'post' && 'postForm' in url) {
            await uploadFileToS3Post({
              file,
              postForm: url.postForm,
              signal: params.signal,
              retry: params.retry,
              retryDelay: params.retryDelay,
              onProgress: (progress) => {
                uploads.set(url.file.objectInfo.key, {
                  ...uploads.get(url.file.objectInfo.key)!,
                  status: progress === 1 ? 'complete' : 'uploading',
                  progress,
                });

                params.onFileStateChange?.({
                  file: uploads.get(url.file.objectInfo.key)!,
                });
              },
            });
          } else if ('signedUrl' in url) {
            await uploadFileToS3({
              file,
              signedUrl: url.signedUrl,
              objectMetadata: url.file.objectInfo.metadata,
              objectCacheControl: url.file.objectInfo.cacheControl,
              signal: params.signal,
              retry: params.retry,
              retryDelay: params.retryDelay,
              onProgress: (progress) => {
                uploads.set(url.file.objectInfo.key, {
                  ...uploads.get(url.file.objectInfo.key)!,
                  status: progress === 1 ? 'complete' : 'uploading',
                  progress,
                });

                params.onFileStateChange?.({
                  file: uploads.get(url.file.objectInfo.key)!,
                });
              },
            });
          } else {
            throw new Error(
              'Invalid upload configuration: missing signedUrl or postForm'
            );
          }
        }
      } catch (error) {
        if (isMultipart) {
          await fetch(url.abortSignedUrl, {
            method: 'DELETE',
          }).catch(() => {});
        }

        uploads.set(url.file.objectInfo.key, {
          ...uploads.get(url.file.objectInfo.key)!,
          status: 'failed',
          error: {
            type: params.signal?.aborted ? 'aborted' : 's3_upload',
            message: params.signal?.aborted
              ? 'Upload aborted.'
              : 'Failed to upload file to S3.',
          },
        });

        params.onFileStateChange?.({
          file: uploads.get(url.file.objectInfo.key)!,
        });
      }
    });

    params.onUploadBegin?.({
      files: Array.from(uploads.values()) as FileUploadInfo<'pending'>[],
      metadata: serverMetadata,
    });

    uploads.forEach((file) => {
      params.onFileStateChange?.({
        file,
      });
    });

    const batchSize = params.uploadBatchSize || files.length;
    for (let i = 0; i < uploadPromises.length; i += batchSize) {
      await Promise.all(
        uploadPromises.slice(i, i + batchSize).map((fn) => fn())
      );
    }

    return {
      files: Array.from(uploads.values()).filter(
        (file) => file.status === 'complete'
      ) as FileUploadInfo<'complete'>[],
      failedFiles: Array.from(uploads.values()).filter(
        (file) => file.status === 'failed'
      ) as FileUploadInfo<'failed'>[],
      metadata: serverMetadata,
    };
  } catch (error) {
    if (params.signal?.aborted) {
      throw new ClientUploadErrorClass({
        type: 'aborted',
        message: 'Upload aborted.',
      });
    }

    if (error instanceof ClientUploadErrorClass) {
      throw error;
    } else if (error instanceof Error) {
      throw new ClientUploadErrorClass({
        type: 'unknown',
        message: error.message,
      });
    } else {
      throw new ClientUploadErrorClass({
        type: 'unknown',
        message: 'Failed to upload files.',
      });
    }
  }
}

/**
 * Upload a single file to S3.
 *
 * This is a convenience wrapper around uploadFiles for single file uploads.
 * Unlike uploadFiles, this function will throw an error if the upload fails,
 * making it suitable for cases where you need strict error handling.
 *
 * @param params - Upload configuration object
 * @param params.api - API endpoint for requesting signed URLs (default: '/api/upload')
 * @param params.route - Upload route name that matches your server configuration
 * @param params.file - Single file to upload
 * @param params.metadata - Optional metadata to send to your server
 * @param params.multipartBatchSize - Number of parts to upload simultaneously in multipart uploads
 * @param params.signal - AbortSignal to cancel the upload operation
 * @param params.headers - Additional headers to send when requesting signed URLs
 * @param params.credentials - Credentials mode for the signed URL request
 * @param params.retry - Number of retry attempts for failed operations
 * @param params.retryDelay - Delay in milliseconds between retry attempts
 * @param params.onUploadBegin - Callback fired when upload begins with file info and server metadata
 * @param params.onFileStateChange - Callback fired when the file's upload state changes
 *
 * @returns Promise resolving to upload result with the successfully uploaded file and server metadata
 *
 * @throws {ClientUploadErrorClass} When the upload fails, server errors occur, or upload is aborted
 */
export async function uploadFile(params: {
  api?: string;
  route: string;
  file: File;
  metadata?: ServerMetadata;
  multipartBatchSize?: number;
  signal?: AbortSignal;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
  retry?: number;
  retryDelay?: number;

  onUploadBegin?: (data: {
    file: FileUploadInfo<'pending'>;
    metadata: ServerMetadata;
  }) => void;
  onFileStateChange?: (data: { file: FileUploadInfo<UploadStatus> }) => void;
}): Promise<DirectUploadResult<false>> {
  const { files, metadata } = await uploadFiles({
    api: params.api,
    route: params.route,
    files: [params.file],
    metadata: params.metadata,
    multipartBatchSize: params.multipartBatchSize,
    signal: params.signal,
    headers: params.headers,
    credentials: params.credentials,
    retry: params.retry,
    retryDelay: params.retryDelay,
    onUploadBegin: (data) => {
      params.onUploadBegin?.({
        file: data.files[0]!,
        metadata: data.metadata,
      });
    },
    onFileStateChange: params.onFileStateChange,
  });

  const file = files[0];

  if (!file) {
    throw new ClientUploadErrorClass({
      type: 'unknown',
      message: 'Failed to upload file.',
    });
  }

  return {
    file,
    metadata,
  };
}
