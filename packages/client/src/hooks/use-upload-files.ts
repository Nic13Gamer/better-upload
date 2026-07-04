import { ClientUploadErrorClass } from '@/types/error';
import type { UploadHookProps, UploadHookReturn } from '@/types/internal';
import type {
  ClientUploadError,
  FileUploadInfo,
  UploadStatus,
} from '@/types/public';
import { uploadFiles } from '@/utils';
import type { UnknownMetadata } from '@repo/shared/types/router';
import { useCallback, useMemo, useState } from 'react';

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
  const [uploadStates, setUploadStates] = useState(
    () => new Map<string, FileUploadInfo<UploadStatus>>()
  );
  const [serverMetadata, setServerMetadata] = useState<UnknownMetadata>({});

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<ClientUploadError | null>(null);

  const uploadStatesArray = useMemo(() => Array.from(uploadStates.values()), [uploadStates]);

  const uploadedFiles = useMemo(
    () =>
      uploadStatesArray.filter(
        (file) => file.status === 'complete'
      ) as FileUploadInfo<'complete'>[],
    [uploadStatesArray]
  );
  const failedFiles = useMemo(
    () =>
      uploadStatesArray.filter(
        (file) => file.status === 'failed'
      ) as FileUploadInfo<'failed'>[],
    [uploadStatesArray]
  );
  const allSucceeded = useMemo(
    () =>
      uploadStatesArray.length > 0 &&
      uploadStatesArray.every((file) => file.status === 'complete'),
    [uploadStatesArray]
  );
  const hasFailedFiles = useMemo(
    () =>
      uploadStatesArray.length > 0 &&
      uploadStatesArray.some((file) => file.status === 'failed'),
    [uploadStatesArray]
  );
  const isSettled = useMemo(
    () =>
      uploadStatesArray.length > 0 &&
      uploadStatesArray.every(
        (file) => file.status === 'complete' || file.status === 'failed'
      ),
    [uploadStatesArray]
  );
  const averageProgress = useMemo(
    () =>
      uploadStatesArray.length === 0
        ? 0
        : uploadStatesArray.reduce((acc, file) => acc + file.progress, 0) /
          uploadStatesArray.length,
    [uploadStatesArray]
  );

  const uploadAsync = useCallback(
    async (
      files: File[] | FileList,
      { metadata }: { metadata?: UnknownMetadata } = {}
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
            setUploadStates((prev) => new Map(prev).set(file.objectInfo.key, file));
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
      options: { metadata?: UnknownMetadata } = {}
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
    setUploadStates(new Map<string, FileUploadInfo<UploadStatus>>());
    setServerMetadata({});
    setIsPending(false);
    setError(null);
  }, []);

  const control = useMemo(
    () => ({
      uploadAsync,
      upload,
      reset,
      progresses: uploadStatesArray,
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
      uploadStatesArray,
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
