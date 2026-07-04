import { ClientUploadErrorClass } from '@/types/error';
import type { DirectUploadResult } from '@/types/internal';
import type { FileUploadInfo, UploadStatus } from '@/types/public';
import type {
  UnknownMetadata,
  UploadRequestSuccessResponse,
} from '@repo/shared/types/router';
import { withRetries } from './internal/retry';
import {
  uploadMultipartToSignedUrl,
  uploadToSignedUrl,
} from './internal/signed-upload';

/**
 * Upload multiple files to S3.
 *
 * This will not throw if one of the uploads fails, but will return the files that failed to upload.
 */
export async function uploadFiles(params: {
  api?: string;
  route: string;
  files: File[] | FileList;
  metadata?: UnknownMetadata;
  multipartBatchSize?: number;
  uploadBatchSize?: number;
  signal?: AbortSignal;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
  retry?: number;
  retryDelay?: number;

  onUploadBegin?: (data: {
    files: FileUploadInfo<'pending'>[];
    metadata: UnknownMetadata;
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

    const uploadRes = await withRetries(
      () =>
        fetch(params.api || '/api/upload', {
          method: 'POST',
          body: JSON.stringify({
            upload: {
              route: params.route,
              metadata: params.metadata,
              files: files.map((file, idx) => ({
                _id: idx,
                name: file.name,
                size: file.size,
                type: file.type,
              })),
            },
          }),
          headers,
          credentials: params.credentials,
          signal: params.signal,
        }),
      { retry: params.retry, delay: params.retryDelay, signal: params.signal }
    );

    if (!uploadRes.ok) {
      const { error } = (await uploadRes.json()) as any;

      throw new ClientUploadErrorClass({
        type: error.type || 'unknown',
        message: error.message || 'Failed to obtain pre-signed URLs.',
      });
    }

    const payload = (await uploadRes.json()) as UploadRequestSuccessResponse;

    const uploads =
      'multipart' in payload ? payload.multipart.uploads : payload.uploads;
    const serverMetadata = payload.metadata;
    const partSize = 'multipart' in payload ? payload.multipart.partSize : 0;

    if (!uploads || uploads.length === 0) {
      throw new ClientUploadErrorClass({
        type: 'unknown',
        message:
          'No pre-signed URLs returned from server. Check your upload router config.',
      });
    }

    const uploadStates = new Map<string, FileUploadInfo<UploadStatus>>(
      uploads.map((upload) => {
        const isSkipped = 'skip' in upload && upload.skip === 'completed';
        const { _id, ...fileInfo } = upload.file;

        return [
          upload.file.objectInfo.key,
          {
            skip: isSkipped ? 'completed' : undefined,
            status: isSkipped ? 'complete' : 'pending',
            progress: isSkipped ? 1 : 0,
            raw: files[_id]!,
            ...fileInfo,
          },
        ];
      })
    );

    const uploadPromises = uploads.map((upload) => async () => {
      if ('skip' in upload) {
        return;
      }

      const file = files[upload.file._id]!;
      const key = upload.file.objectInfo.key;

      try {
        uploadStates.set(key, {
          ...uploadStates.get(key)!,
          status: 'uploading',
          progress: 0,
        });

        params.onFileStateChange?.({
          file: uploadStates.get(key)!,
        });

        if ('parts' in upload) {
          await uploadMultipartToSignedUrl({
            file,
            parts: upload.parts,
            partSize,
            uploadId: upload.uploadId,
            completeSignedUrl: upload.completeSignedUrl,
            partsBatchSize: params.multipartBatchSize,
            signal: params.signal,
            retry: params.retry,
            retryDelay: params.retryDelay,
            onProgress: (progress) => {
              if (uploadStates.get(key)!.status === 'failed') {
                return;
              }

              uploadStates.set(key, {
                ...uploadStates.get(key)!,
                status: progress === 1 ? 'complete' : 'uploading',
                progress,
              });

              params.onFileStateChange?.({
                file: uploadStates.get(key)!,
              });
            },
          });
        } else {
          await uploadToSignedUrl({
            file,
            signedUrl: upload.signedUrl,
            headers: upload.headers,
            signal: params.signal,
            retry: params.retry,
            retryDelay: params.retryDelay,
            onProgress: (progress) => {
              uploadStates.set(key, {
                ...uploadStates.get(key)!,
                status: progress === 1 ? 'complete' : 'uploading',
                progress,
              });

              params.onFileStateChange?.({
                file: uploadStates.get(key)!,
              });
            },
          });
        }
      } catch (error) {
        if ('parts' in upload) {
          await fetch(upload.abortSignedUrl, {
            method: 'DELETE',
          }).catch(() => {});
        }

        uploadStates.set(key, {
          ...uploadStates.get(key)!,
          status: 'failed',
          error: {
            type: params.signal?.aborted ? 'aborted' : 's3_upload',
            message: params.signal?.aborted
              ? 'Upload aborted.'
              : 'Failed to upload file to S3.',
          },
        });

        params.onFileStateChange?.({
          file: uploadStates.get(key)!,
        });
      }
    });

    params.onUploadBegin?.({
      files: Array.from(uploadStates.values()) as FileUploadInfo<'pending'>[],
      metadata: serverMetadata,
    });

    uploadStates.forEach((file) => {
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
      files: Array.from(uploadStates.values()).filter(
        (file) => file.status === 'complete'
      ) as FileUploadInfo<'complete'>[],
      failedFiles: Array.from(uploadStates.values()).filter(
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
 * This will throw if the upload fails.
 */
export async function uploadFile(params: {
  api?: string;
  route: string;
  file: File;
  metadata?: UnknownMetadata;
  multipartBatchSize?: number;
  signal?: AbortSignal;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
  retry?: number;
  retryDelay?: number;

  onUploadBegin?: (data: {
    file: FileUploadInfo<'pending'>;
    metadata: UnknownMetadata;
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
