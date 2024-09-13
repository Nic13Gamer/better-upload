import { Loader2, Upload } from 'lucide-react';
import { useUploadFile } from 'next-upload/client';
import { useId } from 'react';
import { Button } from '../ui/button';

export function UploadButton() {
  const id = useId();

  const { upload, isPending } = useUploadFile({
    route: 'imageDemo',
  });

  return (
    <Button disabled={isPending} className="relative">
      <label htmlFor={id} className="absolute inset-0 cursor-pointer">
        <input
          id={id}
          className="absolute inset-0 size-0 opacity-0"
          type="file"
          accept="image/*"
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
