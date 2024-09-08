'use client';

import { useUploadFile } from 'next-upload/client';

export function FileUploader() {
  const { upload } = useUploadFile({
    route: 'image',
    onSuccess() {
      console.log('File uploaded!');
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
