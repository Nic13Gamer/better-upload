import { useCallback, useState } from 'react';
import { UploadFileError } from '../types/error';
import type { ServerMetadata } from '../types/internal';
import type { ClientUploadFileError, UploadedFile } from '../types/public';
import { uploadFiles } from '../utils/internal/upload';

type ErrorState = Omit<ClientUploadFileError, 'objectKey'> & {
  objectKeys?: string[];
};

type UseUploadFilesProps = {
  /**
   * The API endpoint to use for uploading files.
   *
   * @default '/api/upload'
   */
  api?: string;

  /**
   * The route to use to upload the files. Should match the upload route name defined in the server, and `multipleFiles` should be `true`.
   */
  route: string;

  /**
   * Whether files should be uploaded sequentially, rather than in parallel.
   *
   * This can be useful to reduce the load on the S3 server, but it will take longer to upload all files.
   *
   * @default false
   */
  sequential?: boolean;

  /**
   * The number of parts that will be uploaded in parallel when uploading a file.
   *
   * **Only used in multipart uploads.**
   *
   * @default All parts at once.
   */
  multipartBatchSize?: number;

  /**
   * Callback that is called before requesting the pre-signed URLs. Use this to modify the files before uploading them, like resizing or compressing.
   *
   * You can also throw an error to reject the file upload.
   */
  onBeforeUpload?: (data: {
    files: File[];
  }) => void | File[] | Promise<void | File[]>;

  /**
   * Event that is called when the files start being uploaded to S3. This happens after the server responds with the pre-signed URL.
   */
  onUploadBegin?: (data: {
    /**
     * Information about the files to be uploaded.
     */
    files: UploadedFile[];

    /**
     * Metadata sent from the server.
     */
    metadata: ServerMetadata;
  }) => void;

  /**
   * Event that is called when a file upload progress changes.
   */
  onUploadProgress?: (data: {
    /**
     * Information about the file being uploaded.
     */
    file: Omit<UploadedFile, 'raw'>;

    /**
     * The progress of the upload, goes from 0 to 1.
     *
     * @example 0.5
     */
    progress: number;
  }) => void;

  /**
   * Event that is called after the files are successfully uploaded.
   */
  onUploadComplete?: (data: {
    /**
     * Information about the uploaded files.
     */
    files: UploadedFile[];

    /**
     * Information about the files that failed to be uploaded.
     */
    failedFiles: UploadedFile[];

    /**
     * Metadata sent from the server.
     */
    metadata: ServerMetadata;
  }) => void | Promise<void>;

  /**
   * Event that is called if an error occurs during the upload of a file.
   */
  onUploadError?: (error: ClientUploadFileError) => void;

  /**
   * Event that is called after the file upload is either successfully completed or an error occurs.
   */
  onUploadSettled?: () => void | Promise<void>;
};

export function useUploadFiles({
  api = '/api/upload',
  route,
  sequential,
  multipartBatchSize,
  onUploadBegin,
  onBeforeUpload,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  onUploadSettled,
}: UseUploadFilesProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [failedFiles, setFailedFiles] = useState<UploadedFile[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [progresses, setProgresses] = useState<Record<string, number>>({});

  const upload = useCallback(
    async (
      files: File[] | FileList,
      { metadata }: { metadata?: ServerMetadata } = {}
    ) => {
      setUploadedFiles([]);
      setFailedFiles([]);
      setIsSuccess(false);
      setIsError(false);
      setError(null);
      setProgresses({});

      setIsPending(true);

      const fileArray = Array.from(files);

      if (fileArray.length === 0) {
        setIsError(true);
        setIsSuccess(false);
        setIsPending(false);
        setError({ type: 'no_files', message: 'No files to upload.' });
        onUploadError?.({ type: 'no_files', message: 'No files to upload.' });
        onUploadSettled?.();
        return;
      }

      try {
        let filesToUpload = fileArray;

        if (onBeforeUpload) {
          const result = await onBeforeUpload({ files: fileArray });

          if (Array.isArray(result)) {
            if (result.length === 0) {
              throw new UploadFileError({
                type: 'no_files',
                message: 'No files to upload.',
              });
            }

            filesToUpload = result;
          }
        }

        const {
          uploadedFiles: s3UploadedFiles,
          failedFiles: s3FailedFiles,
          serverMetadata,
        } = await uploadFiles({
          api,
          route,
          files: filesToUpload,
          metadata,
          sequential,
          throwOnError: false,
          multipartBatchSize,
          onBegin: onUploadBegin,
          onProgress: (data) => {
            setProgresses((prev) => ({
              ...prev,
              [data.file.objectKey]: data.progress,
            }));
            onUploadProgress?.(data);
          },
          onError: (error) => {
            setIsError(true);

            setError((prev) => {
              const newError = {
                type: error.type,
                message: error.message || null,
                objectKeys: error.objectKey ? [error.objectKey] : undefined,
              };

              if (prev?.objectKeys && error.objectKey) {
                return {
                  ...prev,
                  objectKeys: [...prev.objectKeys, error.objectKey],
                };
              }

              return newError;
            });
            onUploadError?.({
              type: error.type,
              message: error.message || null,
              objectKey: error.objectKey,
            });
          },
        });

        setUploadedFiles(s3UploadedFiles);
        setFailedFiles(s3FailedFiles);
        setIsPending(false);
        setIsSuccess(true);

        await onUploadComplete?.({
          files: s3UploadedFiles,
          failedFiles: s3FailedFiles,
          metadata: serverMetadata,
        });
      } catch (error) {
        setIsError(true);
        setIsSuccess(false);
        setIsPending(false);
        setProgresses({});

        if (error instanceof UploadFileError) {
          setError((prev) => {
            const newError = {
              type: error.type,
              message: error.message || null,
              objectKeys: error.objectKey ? [error.objectKey] : undefined,
            };

            if (prev?.objectKeys && error.objectKey) {
              return {
                ...prev,
                objectKeys: [...prev.objectKeys, error.objectKey],
              };
            }

            return newError;
          });
          onUploadError?.({
            type: error.type,
            message: error.message || null,
            objectKey: error.objectKey,
          });
        } else {
          setError({ type: 'unknown', message: null });
          onUploadError?.({ type: 'unknown', message: null });
        }
      }

      await onUploadSettled?.();
    },
    [
      api,
      route,
      sequential,
      multipartBatchSize,
      onBeforeUpload,
      onUploadBegin,
      onUploadProgress,
      onUploadComplete,
      onUploadError,
      onUploadSettled,
    ]
  );

  const reset = useCallback(() => {
    setUploadedFiles([]);
    setFailedFiles([]);
    setIsPending(false);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
    setProgresses({});
  }, []);

  return {
    upload,
    reset,
    uploadedFiles,
    failedFiles,
    progresses,
    isPending,
    isSuccess,
    isError,
    error,
  };
}
