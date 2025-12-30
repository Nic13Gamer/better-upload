'use client';

import { useUploadFiles } from '@better-upload/client';
import { toast } from 'sonner';
import { UploadPasteArea } from './ui/upload-paste-area';

export function PasteUploader() {
  const { control } = useUploadFiles({
    route: 'images',
    onUploadComplete: ({ files }) => {
      toast.success(`Uploaded ${files.length} files`);
    },
    onUploadBegin: ({ files }) => {
      toast.info(`Uploading ${files.length} files`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <UploadPasteArea
      control={control}
      accept="image/*"
      description={{
        fileTypes: 'JPEG, PNG, GIF',
        maxFileSize: '2MB',
        maxFiles: 4,
      }}
    />
  );
}
