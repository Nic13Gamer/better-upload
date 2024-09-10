import { useCallback, useState } from 'react';
import type { ClientUploadFileError, UploadedFile } from '../types/public';

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
   * Callback that is called after the file is successfully uploaded.
   */
  onSuccess?: (data: {
    /**
     * Information about the uploaded file.
     */
    file: UploadedFile;

    /**
     * Metadata sent from the server.
     */
    metadata: Record<string, unknown | undefined>;
  }) => void;

  /**
   * Callback that is called if an error occurs during file upload.
   */
  onError?: (error: ClientUploadFileError) => void;
};

export function useUploadFile({
  api = '/api/upload',
  route,
  onSuccess,
  onError,
}: UseUploadFileProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<ClientUploadFileError | null>(null);

  const upload = useCallback(
    async (
      file: File,
      { metadata }: { metadata?: Record<string, unknown> } = {}
    ) => {
      setUploadedFile(null);
      setIsSuccess(false);
      setIsError(false);
      setError(null);

      setIsPending(true);

      try {
        const res = await fetch(api, {
          method: 'POST',
          body: JSON.stringify({
            route,
            metadata,
            files: [
              {
                name: file.name,
                size: file.size,
                type: file.type,
              },
            ],
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const { error } = (await res.json()) as any;

          setIsError(true);
          setIsSuccess(false);
          setIsPending(false);

          if (error.message) {
            setError({
              type: error.type || 'unknown',
              message: error.message || null,
            });
            onError?.({
              type: error.type || 'unknown',
              message: error.message || null,
            });
          } else {
            setError({ type: 'unknown', message: null });
            onError?.({ type: 'unknown', message: null });
          }

          return;
        }

        const {
          signedUrl,
          file: signedFile,
          metadata: uploadedMetadata,
        } = (await res.json()) as any;

        if (!signedUrl || !signedFile) {
          setIsError(true);
          setIsSuccess(false);
          setIsPending(false);

          setError({
            type: 'unknown',
            message: 'No signed URL. Is the route set to multiple files?',
          });
          onError?.({
            type: 'unknown',
            message: 'No signed URL. Is the route set to multiple files?',
          });

          return;
        }

        const uploadRes = await fetch(signedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadRes.ok) {
          setIsError(true);
          setIsSuccess(false);
          setIsPending(false);

          setError({ type: 'unknown', message: null });
          onError?.({ type: 'unknown', message: null });

          return;
        }

        const uploaded: UploadedFile = {
          raw: file,
          name: signedFile.name,
          size: signedFile.size,
          type: signedFile.type,
          bucketKey: signedFile.bucketKey,
        };

        setUploadedFile(uploaded);
        setIsPending(false);
        setIsSuccess(true);

        onSuccess?.({ file: uploaded, metadata: uploadedMetadata });
      } catch (error) {
        setIsError(true);
        setIsSuccess(false);
        setIsPending(false);

        setError({ type: 'unknown', message: null });
        onError?.({ type: 'unknown', message: null });
      }
    },
    [api, route, onSuccess, onError]
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
