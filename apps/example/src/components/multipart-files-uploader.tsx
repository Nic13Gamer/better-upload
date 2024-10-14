'use client';

import { toast } from 'sonner';
import { UploadDropzone } from './ui/upload-dropzone';

export function MultipartFilesUploader() {
  return (
    <UploadDropzone
      route="multipart"
      description={{
        maxFileSize: '80MB',
        maxFiles: 1,
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
