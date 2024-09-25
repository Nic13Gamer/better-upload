import { useCallback, useState } from 'react';
import type { ClientUploadFileError, UploadedFile } from '../types/public';

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
   * Callback that is called after the files are successfully uploaded.
   */
  onSuccess?: (data: {
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
   * Callback that is called if an error occurs during the files upload.
   */
  onError?: (error: ClientUploadFileError) => void;
};

export function useUploadFiles({
  api = '/api/upload',
  route,
  sequential,
  onSuccess,
  onError,
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
        const res = await fetch(api, {
          method: 'POST',
          body: JSON.stringify({
            route,
            metadata,
            files: fileArray.map((file) => ({
              name: file.name,
              size: file.size,
              type: file.type,
            })),
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

        const { files: signedUrls, metadata: uploadedMetadata } =
          (await res.json()) as any;

        if (!signedUrls) {
          setIsError(true);
          setIsSuccess(false);
          setIsPending(false);

          setError({
            type: 'unknown',
            message: 'No signed URLs. Is the route set to multiple files?',
          });
          onError?.({
            type: 'unknown',
            message: 'No signed URLs. Is the route set to multiple files?',
          });

          return;
        }

        const uploaded: UploadedFile[] = [];

        async function uploadSingleFile(file: File) {
          const data = signedUrls.find(
            (url: any) =>
              url.file.name === file.name &&
              url.file.size === file.size &&
              url.file.type === file.type
          );

          const uploadRes = await fetch(data.signedUrl, {
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

          const uploadedFile: UploadedFile = {
            raw: file,
            name: data.file.name,
            size: data.file.size,
            type: data.file.type,
            objectKey: data.file.objectKey,
          };

          uploaded.push(uploadedFile);
        }

        if (sequential) {
          for (const file of fileArray) {
            await uploadSingleFile(file);
          }
        } else {
          await Promise.all(fileArray.map(uploadSingleFile));
        }

        setUploadedFiles(uploaded);
        setIsPending(false);
        setIsSuccess(true);

        onSuccess?.({ files: uploaded, metadata: uploadedMetadata });
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
