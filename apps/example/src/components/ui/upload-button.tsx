import { Button } from '@/components/ui/button';
import type { UploadHookControl } from '@better-upload/client';
import { Loader2, Upload } from 'lucide-react';
import { useId } from 'react';

type UploadButtonProps = {
  control: UploadHookControl<false>;
  id?: string;
  accept?: string;
  metadata?: Record<string, unknown>;
  uploadOverride?: (
    ...args: Parameters<UploadHookControl<false>['upload']>
  ) => void;

  // Add any additional props you need.
};

export function UploadButton({
  control: { upload, isPending },
  id: _id,
  accept,
  metadata,
  uploadOverride,
}: UploadButtonProps) {
  const id = useId();

  return (
    <Button disabled={isPending} className="relative" type="button">
      <label htmlFor={_id || id} className="absolute inset-0 cursor-pointer">
        <input
          id={_id || id}
          className="absolute inset-0 size-0 opacity-0"
          type="file"
          accept={accept}
          onChange={(e) => {
            if (e.target.files?.[0] && !isPending) {
              if (uploadOverride) {
                uploadOverride(e.target.files[0], { metadata });
              } else {
                upload(e.target.files[0], { metadata });
              }
            }
            e.target.value = '';
          }}
        />
      </label>
      {isPending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Upload file
        </>
      ) : (
        <>
          <Upload className="size-4" />
          Upload file
        </>
      )}
    </Button>
  );
}
