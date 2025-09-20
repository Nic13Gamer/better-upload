import { useCallback, useMemo, useState } from 'react';
import { ClientUploadErrorClass } from '../types/error';
import type {
  ServerMetadata,
  UploadHookProps,
  UploadHookReturn,
} from '../types/internal';
import type {
  ClientUploadError,
  FileUploadInfo,
  UploadStatus,
} from '../types/public';
import { uploadFiles } from '../utils/upload';

export function useUploadFiles({
  api,
  route,
  uploadBatchSize,
  multipartBatchSize,
  headers,
  credentials,
  signal,
  retry,
  retryDelay,
  onError,
  onBeforeUpload,
  onUploadBegin,
  onUploadComplete,
  onUploadFail,
  onUploadProgress,
  onUploadSettle,
}: UploadHookProps<true>): UploadHookReturn<true> {
  const [uploads, setUploads] = useState(
    () => new Map<string, FileUploadInfo<UploadStatus>>()
  );
  const [serverMetadata, setServerMetadata] = useState<ServerMetadata>({});

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<ClientUploadError | null>(null);

  const uploadsArray = useMemo(() => Array.from(uploads.values()), [uploads]);

  const uploadedFiles = useMemo(
    () =>
      uploadsArray.filter(
        (file) => file.status === 'complete'
      ) as FileUploadInfo<'complete'>[],
    [uploadsArray]
  );
  const failedFiles = useMemo(
    () =>
      uploadsArray.filter(
        (file) => file.status === 'failed'
      ) as FileUploadInfo<'failed'>[],
    [uploadsArray]
  );
  const allSucceeded = useMemo(
    () =>
      uploadsArray.length > 0 &&
      uploadsArray.every((file) => file.status === 'complete'),
    [uploadsArray]
  );
  const hasFailedFiles = useMemo(
    () =>
      uploadsArray.length > 0 &&
      uploadsArray.some((file) => file.status === 'failed'),
    [uploadsArray]
  );
  const isSettled = useMemo(
    () =>
      uploadsArray.length > 0 &&
      uploadsArray.every(
        (file) => file.status === 'complete' || file.status === 'failed'
      ),
    [uploadsArray]
  );
  const averageProgress = useMemo(
    () =>
      uploadsArray.length === 0
        ? 0
        : uploadsArray.reduce((acc, file) => acc + file.progress, 0) /
          uploadsArray.length,
    [uploadsArray]
  );

  const uploadAsync = useCallback(
    async (
      files: File[] | FileList,
      { metadata }: { metadata?: ServerMetadata } = {}
    ) => {
      reset();

      setIsPending(true);

      const fileArray = Array.from(files);

      try {
        if (fileArray.length === 0) {
          throw new ClientUploadErrorClass({
            type: 'no_files',
            message: 'No files to upload.',
          });
        }

        let filesToUpload = fileArray;

        if (onBeforeUpload) {
          const callbackResult = await onBeforeUpload({ files: fileArray });

          if (Array.isArray(callbackResult)) {
            if (callbackResult.length === 0) {
              throw new ClientUploadErrorClass({
                type: 'no_files',
                message: 'No files to upload.',
              });
            }

            filesToUpload = callbackResult;
          }
        }

        const result = await uploadFiles({
          api,
          route,
          files: filesToUpload,
          metadata,
          uploadBatchSize,
          multipartBatchSize,
          headers,
          credentials,
          signal,
          retry,
          retryDelay,
          onUploadBegin,
          onFileStateChange: ({ file }) => {
            setUploads((prev) => new Map(prev).set(file.objectKey, file));
            onUploadProgress?.({ file });
          },
        });

        if (result.files.length > 0) {
          await onUploadComplete?.(result);
        }

        if (result.failedFiles.length > 0) {
          await onUploadFail?.({
            succeededFiles: result.files,
            failedFiles: result.failedFiles,
            metadata: result.metadata,
          });
        }

        setIsPending(false);
        setServerMetadata(result.metadata);
        await onUploadSettle?.(result);

        return result;
      } catch (error) {
        setIsPending(false);

        if (error instanceof ClientUploadErrorClass) {
          onError?.(error);
          setError(error);
          await onUploadSettle?.({ files: [], failedFiles: [], metadata: {} });

          throw error;
        } else if (error instanceof Error) {
          const _error = new ClientUploadErrorClass({
            type: 'unknown',
            message: error.message,
          });

          onError?.(_error);
          setError(_error);
          await onUploadSettle?.({ files: [], failedFiles: [], metadata: {} });

          throw _error;
        } else {
          const _error = new ClientUploadErrorClass({
            type: 'unknown',
            message: 'Failed to upload files.',
          });

          onError?.(_error);
          setError(_error);
          await onUploadSettle?.({ files: [], failedFiles: [], metadata: {} });

          throw _error;
        }
      }
    },
    [
      api,
      route,
      uploadBatchSize,
      multipartBatchSize,
      headers,
      credentials,
      signal,
      onError,
      onBeforeUpload,
      onUploadBegin,
      onUploadComplete,
      onUploadFail,
      onUploadProgress,
      onUploadSettle,
    ]
  );

  const upload = useCallback(
    async (
      files: File[] | FileList,
      options: { metadata?: ServerMetadata } = {}
    ) => {
      try {
        const result = await uploadAsync(files, options);

        return result;
      } catch (error) {
        return {
          files: [],
          failedFiles: [],
          metadata: {},
        };
      }
    },
    [uploadAsync]
  );

  const reset = useCallback(() => {
    setUploads(new Map<string, FileUploadInfo<UploadStatus>>());
    setServerMetadata({});
    setIsPending(false);
    setError(null);
  }, []);

  const control = useMemo(
    () => ({
      uploadAsync,
      upload,
      reset,
      progresses: uploadsArray,
      allSucceeded,
      hasFailedFiles,
      uploadedFiles,
      failedFiles,
      isSettled,
      averageProgress,
      isPending,
      isError: !!error,
      isAborted: signal?.aborted ?? false,
      error,
      metadata: serverMetadata,
    }),
    [
      uploadAsync,
      upload,
      reset,
      uploadsArray,
      allSucceeded,
      hasFailedFiles,
      uploadedFiles,
      failedFiles,
      isSettled,
      averageProgress,
      isPending,
      signal?.aborted,
      error,
      serverMetadata,
    ]
  );

  return {
    ...control,
    control,
  };
}
