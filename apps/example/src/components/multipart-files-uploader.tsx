'use client';

import { toast } from 'sonner';
import { UploadDropzoneProgress } from './ui/upload-dropzone-progress';

export function MultipartFilesUploader() {
  return (
    <UploadDropzoneProgress
      route="multipart"
      description={{
        maxFileSize: '80MB',
        maxFiles: 5,
      }}
      onUploadComplete={({ files }) => {
        toast.success(`Uploaded ${files.length} files`);
      }}
      onUploadBegin={({ files }) => {
        toast.info(`Uploading ${files.length} files`);
      }}
      onUploadError={(error) => {
        toast.error(error.message);
      }}
    />
  );
}
