import { Loader2, Upload } from 'lucide-react';
import { useUploadFile, type UploadedFile } from 'next-upload/client';
import { useId } from 'react';
import { Button } from '../ui/button';

type UploadButtonProps = {
  route: string;
  children?: React.ReactNode;
  accept?: string;

  onUploadComplete?: (data: {
    file: UploadedFile;
    metadata: Record<string, unknown>;
  }) => void;
};

export function UploadButton({ route, children, ...props }: UploadButtonProps) {
  const id = useId();

  const { upload, isPending } = useUploadFile({
    route,
    onSuccess: props.onUploadComplete,
  });

  return (
    <Button disabled={isPending} className="relative">
      <label htmlFor={id} className="absolute inset-0 cursor-pointer">
        <input
          id={id}
          className="size-0"
          type="file"
          accept={props.accept}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              upload(e.target.files[0]);
            }
          }}
        />
      </label>

      {children ??
        (isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Upload file
          </>
        ) : (
          <>
            <Upload className="mr-2 size-4" />
            Upload file
          </>
        ))}
    </Button>
  );
}
