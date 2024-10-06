import { useCallback, useState } from 'react';
import { UploadFilesError } from '../types/error';
import type { ServerMetadata } from '../types/internal';
import type { ClientUploadFileError, UploadedFile } from '../types/public';
import { uploadFiles } from '../utils/upload';

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
  }) => void;

  /**
   * Event that is called if an error occurs during file upload.
   */
  onUploadError?: (error: ClientUploadFileError) => void;

  /**
   * Event that is called after the file upload is either successfully completed or an error occurs.
   */
  onUploadSettled?: () => void;
};

export function useUploadFile({
  api = '/api/upload',
  route,
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

  const upload = useCallback(
    async (file: File, { metadata }: { metadata?: ServerMetadata } = {}) => {
      setUploadedFile(null);
      setIsSuccess(false);
      setIsError(false);
      setError(null);

      setIsPending(true);

      try {
        const { uploadedFiles: s3UploadedFiles, serverMetadata } =
          await uploadFiles({
            api,
            route,
            files: [file],
            metadata,
            sequential: false,
            abortOnS3UploadError: true,
            onUploadBegin: (data) => {
              onUploadBegin?.({
                file: data.files[0]!,
                metadata: data.metadata,
              });
            },
            onUploadProgress,
          });

        const s3UploadedFile = s3UploadedFiles[0]!;

        setUploadedFile(s3UploadedFile);
        setIsPending(false);
        setIsSuccess(true);

        onUploadComplete?.({ file: s3UploadedFile, metadata: serverMetadata });
      } catch (error) {
        setIsError(true);
        setIsSuccess(false);
        setIsPending(false);

        if (error instanceof UploadFilesError) {
          setError({ type: error.type, message: error.message || null });
          onUploadError?.({ type: error.type, message: error.message || null });
        } else {
          setError({ type: 'unknown', message: null });
          onUploadError?.({ type: 'unknown', message: null });
        }
      }

      onUploadSettled?.();
    },
    [api, route, onUploadComplete, onUploadError]
  );

  const reset = useCallback(() => {
    setUploadedFile(null);
    setIsPending(false);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
  }, []);

  return {
    upload,
    reset,
    uploadedFile,
    isPending,
    isSuccess,
    isError,
    error,
  };
}
