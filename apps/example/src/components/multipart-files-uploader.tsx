'use client';

import { useUploadFiles } from 'better-upload/client';
import { toast } from 'sonner';
import { UploadDropzoneProgress } from './ui/upload-dropzone-progress';

export function MultipartFilesUploader() {
  const { control } = useUploadFiles({
    route: 'multipart',
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
    <UploadDropzoneProgress
      control={control}
      description={{
        maxFileSize: '80MB',
        maxFiles: 5,
      }}
    />
  );
}
