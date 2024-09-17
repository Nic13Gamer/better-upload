'use client';

import { toast } from 'sonner';
import { UploadDropzone } from './templates/upload-dropzone';

export function FilesUploader() {
  return (
    <UploadDropzone
      route="images"
      accept="image/*"
      cosmetic={{
        fileTypes: 'JPEG, PNG, GIF',
        maxFileSize: '2MB',
        maxFiles: 4,
      }}
      onUploadComplete={({ files }) => {
        toast.success(`Uploaded ${files.length} files`);
      }}
    />
  );
}
