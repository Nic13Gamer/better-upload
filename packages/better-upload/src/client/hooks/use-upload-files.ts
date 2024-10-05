import { useCallback, useState } from 'react';
import { UploadFilesError } from '../types/error';
import type { ClientUploadFileError, UploadedFile } from '../types/public';
import { uploadFiles } from '../utils/upload';

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
    metadata: Record<string, unknown | undefined>;
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
     * Metadata sent from the server.
     */
    metadata: Record<string, unknown | undefined>;
  }) => void;

  /**
   * Event that is called if an error occurs during the files upload.
   */
  onUploadError?: (error: ClientUploadFileError) => void;
};

export function useUploadFiles({
  api = '/api/upload',
  route,
  sequential,
  onUploadBegin,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
}: UseUploadFilesProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[] | null>(
    null
  );
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<ClientUploadFileError | null>(null);

  const upload = useCallback(
    async (
      files: File[] | FileList,
      { metadata }: { metadata?: Record<string, unknown> } = {}
    ) => {
      setUploadedFiles(null);
      setIsSuccess(false);
      setIsError(false);
      setError(null);

      setIsPending(true);

      const fileArray = Array.from(files);

      try {
        const { uploadedFiles: s3UploadedFiles, serverMetadata } =
          await uploadFiles({
            api,
            route,
            files: fileArray,
            metadata,
            sequential,
            abortOnS3UploadError: true,
            onUploadBegin,
            onUploadProgress,
          });

        setUploadedFiles(s3UploadedFiles);
        setIsPending(false);
        setIsSuccess(true);

        onUploadComplete?.({
          files: s3UploadedFiles,
          metadata: serverMetadata,
        });
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
    },
    [api, route, onUploadComplete, onUploadError]
  );

  const reset = useCallback(() => {
    setUploadedFiles(null);
    setIsPending(false);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
  }, []);

  return {
    upload,
    reset,
    uploadedFiles,
    isPending,
    isSuccess,
    isError,
    error,
  };
}
