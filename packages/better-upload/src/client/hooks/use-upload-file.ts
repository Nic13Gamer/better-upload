import { useMemo } from 'react';
import type { UploadHookProps, UploadHookReturn } from '../types/internal';
import type { UploadHookControl } from '../types/public';
import { useUploadFiles } from './use-upload-files';

export function useUploadFile(
  props: UploadHookProps<false>
): UploadHookReturn<false> {
  const {
    upload,
    uploadAsync,
    reset,
    averageProgress,
    error,
    isError,
    isPending,
    isSettled,
    isAborted,
    allSucceeded,
    metadata,
    uploadedFiles,
  } = useUploadFiles({
    api: props.api,
    route: props.route,
    uploadBatchSize: 1,
    multipartBatchSize: props.multipartBatchSize,
    headers: props.headers,
    credentials: props.credentials,
    signal: props.signal,
    retry: props.retry,
    retryDelay: props.retryDelay,
    onError: props.onError,
    onUploadProgress: props.onUploadProgress,
    onBeforeUpload: props.onBeforeUpload
      ? async ({ files }) => {
          const result = await props.onBeforeUpload!({ file: files[0]! });
          if (result) {
            return [result];
          }
        }
      : undefined,
    onUploadBegin: props.onUploadBegin
      ? ({ files, metadata }) =>
          props.onUploadBegin!({ file: files[0]!, metadata })
      : undefined,
    onUploadComplete: props.onUploadComplete
      ? async ({ files, metadata }) => {
          await props.onUploadComplete!({ file: files[0]!, metadata });
        }
      : undefined,
    onUploadFail: props.onError
      ? async ({ failedFiles }) => {
          props.onError?.({
            type: failedFiles[0]!.error.type,
            message: failedFiles[0]!.error.message,
          });
        }
      : undefined,
    onUploadSettle: props.onUploadSettle
      ? async ({ files, metadata }) => {
          await props.onUploadSettle!({ file: files[0]!, metadata });
        }
      : undefined,
  });

  const uploadedFile = uploadedFiles?.[0] ?? null;

  const control = useMemo<UploadHookControl<false>>(
    () => ({
      upload: async (file, options) => {
        const result = await upload([file], options);
        return { file: result.files[0]!, metadata: result.metadata };
      },
      uploadAsync: async (file, options) => {
        const result = await uploadAsync([file], options);
        return { file: result.files[0]!, metadata: result.metadata };
      },
      reset,
      progress: averageProgress,
      error,
      isError,
      isPending,
      isSettled,
      isSuccess: allSucceeded,
      isAborted,
      metadata,
      uploadedFile,
    }),
    [
      upload,
      uploadAsync,
      reset,
      averageProgress,
      error,
      isError,
      isPending,
      isSettled,
      allSucceeded,
      isAborted,
      metadata,
      uploadedFile,
    ]
  );

  return {
    ...control,
    control,
  };
}
