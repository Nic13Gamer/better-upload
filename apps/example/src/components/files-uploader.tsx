'use client';

import { useUploadFiles } from 'next-upload/client';

export function FilesUploader() {
  const { upload } = useUploadFiles({
    route: 'images',
    onSuccess() {
      console.log('Files uploaded!');
    },
  });

  return (
    <input
      type="file"
      multiple
      accept="image/*"
      onChange={(e) => {
        if (e.target.files) {
          upload(e.target.files);
        }
      }}
    />
  );
}
