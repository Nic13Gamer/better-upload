import { useCallback, useState } from 'react';
import { UploadFileError } from '../types/error';
import type { ServerMetadata } from '../types/internal';
import type { ClientUploadFileError, UploadedFile } from '../types/public';
import { uploadFiles } from '../utils/internal/upload';

type UseUploadFileProps = {
  /**
   * The API endpoint to use for uploading files.
   *
   * @default '/api/upload'
   */
  api?: string;

  /**
   * The route to use to upload the file. Should match the upload route name defined in the server.
   */
  route: string;

  /**
   * The number of parts that will be uploaded in parallel when uploading a file.
   *
   * **Only used in multipart uploads.**
   *
   * @default All parts at once.
   */
  multipartBatchSize?: number;

  /**
   * Callback that is called before requesting the pre-signed URL. Use this to modify the file before uploading it, like resizing or compressing.
   *
   * You can also throw an error to reject the file upload.
   */
  onBeforeUpload?: (data: { file: File }) => void | File | Promise<void | File>;

  /**
   * Event that is called when the file starts being uploaded to S3. This happens after the server responds with the pre-signed URL.
   */
  onUploadBegin?: (data: {
    /**
     * Information about the file to be uploaded.
     */
    file: UploadedFile;

    /**
     * Metadata sent from the server.
     */
    metadata: ServerMetadata;
  }) => void;

  /**
   * Event that is called when the file upload progress changes.
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
   * Event that is called after the file is successfully uploaded.
   */
  onUploadComplete?: (data: {
    /**
     * Information about the uploaded file.
     */
    file: UploadedFile;

    /**
     * Metadata sent from the server.
     */
    metadata: ServerMetadata;
  }) => void | Promise<void>;

  /**
   * Event that is called if an error occurs during file upload.
   */
  onUploadError?: (error: ClientUploadFileError) => void;

  /**
   * Event that is called after the file upload is either successfully completed or an error occurs.
   */
  onUploadSettled?: () => void | Promise<void>;
};

export function useUploadFile({
  api = '/api/upload',
  route,
  multipartBatchSize,
  onBeforeUpload,
  onUploadBegin,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  onUploadSettled,
}: UseUploadFileProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<ClientUploadFileError | null>(null);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(
    async (file: File, { metadata }: { metadata?: ServerMetadata } = {}) => {
      setUploadedFile(null);
      setIsSuccess(false);
      setIsError(false);
      setError(null);
      setProgress(0);

      setIsPending(true);

      let s3UploadedFile = null,
        serverMetadata: ServerMetadata = {};

      try {
        let fileToUpload = file;

        if (onBeforeUpload) {
          const result = await onBeforeUpload({ file });

          if (result instanceof File) {
            fileToUpload = result;
          }
        }

        const res = await uploadFiles({
          api,
          route,
          files: [fileToUpload],
          metadata,
          sequential: false,
          throwOnError: true,
          multipartBatchSize,
          onBegin: (data) => {
            onUploadBegin?.({
              file: data.files[0]!,
              metadata: data.metadata,
            });
          },
          onProgress: (data) => {
            setProgress(data.progress);
            onUploadProgress?.(data);
          },
        });

        s3UploadedFile = res.uploadedFiles[0]!;
        serverMetadata = res.serverMetadata;

        setUploadedFile(s3UploadedFile);
        setIsPending(false);
        setIsSuccess(true);
        setProgress(1);

        await onUploadComplete?.({
          file: s3UploadedFile,
          metadata: serverMetadata,
        });
      } catch (error) {
        setIsError(true);
        setIsSuccess(false);
        setIsPending(false);
        setProgress(0);

        if (error instanceof UploadFileError) {
          setError({
            type: error.type,
            message: error.message || null,
            objectKey: error.objectKey,
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

      return {
        file: s3UploadedFile,
        metadata: serverMetadata,
      };
    },
    [
      api,
      route,
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
    setUploadedFile(null);
    setIsPending(false);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
    setProgress(0);
  }, []);

  return {
    upload,
    reset,
    uploadedFile,
    progress,
    isPending,
    isSuccess,
    isError,
    error,
  };
}
