'use client';

import { useUploadFile } from 'next-upload/client';
import { toast } from 'sonner';

export function FileUploader() {
  const { upload, reset } = useUploadFile({
    route: 'image',
    onSuccess() {
      reset();
      toast.success('File uploaded');
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        if (e.target.files?.[0]) {
          upload(e.target.files[0]);
        }
      }}
    />
  );
}
