'use client';

import { useUploadFiles } from '@better-upload/client';
import { toast } from 'sonner';
import { UploadDropzone } from './ui/upload-dropzone';
import { UploadProgress } from './ui/upload-progress';

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
    <div className="flex flex-col gap-3">
      <UploadDropzone
        control={control}
        description={{
          maxFileSize: '80MB',
          maxFiles: 5,
        }}
      />
      <UploadProgress control={control} />
    </div>
  );
}
