import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import {
  useUploadFile,
  type ClientUploadFileError,
  type UploadedFile,
} from 'better-upload/client';
import { useId } from 'react';

type UploadButtonProps = {
  route: string;
  accept?: string;

  onUploadComplete?: (data: {
    file: UploadedFile;
    metadata: Record<string, unknown>;
  }) => void;
  onUploadError?: (error: ClientUploadFileError) => void;

  // Add any additional props you need.
};

export function UploadButton({
  route,
  accept,
  onUploadComplete,
  onUploadError,
}: UploadButtonProps) {
  const id = useId();

  const { upload, isPending } = useUploadFile({
    route,
    onSuccess: onUploadComplete,
    onError: onUploadError,

    // Add any additional configuration, like `api`.
  });

  return (
    <Button disabled={isPending} className="relative">
      <label htmlFor={id} className="absolute inset-0 cursor-pointer">
        <input
          id={id}
          className="absolute inset-0 size-0 opacity-0"
          type="file"
          accept={accept}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              upload(e.target.files[0]);
            }
          }}
        />
      </label>
      {isPending ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Upload file
        </>
      ) : (
        <>
          <Upload className="mr-2 size-4" />
          Upload file
        </>
      )}
    </Button>
  );
}
