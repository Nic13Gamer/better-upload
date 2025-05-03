'use client';

import { useUploadFile } from 'better-upload/client';
import { toast } from 'sonner';
import { UploadButton } from './ui/upload-button';

export function FileUploader() {
  const { control } = useUploadFile({
    route: 'image',
    onUploadComplete: ({ file }) => {
      toast.success(`Uploaded ${file.name}`);
    },
    onUploadBegin: ({ file }) => {
      toast.info(`Uploading ${file.name}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return <UploadButton control={control} accept="image/*" />;
}
