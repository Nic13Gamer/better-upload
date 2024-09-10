'use client';

import { useUploadFiles } from 'next-upload/client';
import { toast } from 'sonner';

export function FilesUploader() {
  const { upload, reset } = useUploadFiles({
    route: 'images',
    onSuccess({ files }) {
      reset();
      toast.success(`Uploaded ${files.length} files`);
    },
    onError(error) {
      toast.error(error.message);
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
