import { Button } from '@/components/ui/button';
import { useUploadFile } from 'better-upload/client';
import { Loader2, Upload } from 'lucide-react';
import { useId, useRef } from 'react';

type UploadButtonProps = Parameters<typeof useUploadFile>[0] & {
  accept?: string;
  metadata?: Record<string, unknown>;

  // Add any additional props you need.
};

export function UploadButton({
  accept,
  metadata,
  ...params
}: UploadButtonProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { upload, isPending } = useUploadFile({
    ...params,
    onUploadSettled: () => {
      if (inputRef.current) {
        inputRef.current.value = '';
      }

      params.onUploadSettled?.();
    },
  });

  return (
    <Button disabled={isPending} className="relative">
      <label htmlFor={id} className="absolute inset-0 cursor-pointer">
        <input
          id={id}
          ref={inputRef}
          className="absolute inset-0 size-0 opacity-0"
          type="file"
          accept={accept}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              upload(e.target.files[0], { metadata });
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
