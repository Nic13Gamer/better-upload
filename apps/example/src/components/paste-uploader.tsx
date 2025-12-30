'use client';

import { useUploadFiles } from '@better-upload/client';
import { toast } from 'sonner';
import { UploadPasteArea } from './ui/upload-paste-area';

export function PasteUploader() {
  const { control } = useUploadFiles({
    route: 'images',
    onUploadComplete: ({ files }) => {
      toast.success(`${files.length} file${files.length !== 1 ? 's' : ''} uploaded successfully`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <UploadPasteArea
      control={control}
      accept="image/*"
      description="JPEG, PNG, GIF • Up to 2MB each • Max 4 files"
    />
  );
}
