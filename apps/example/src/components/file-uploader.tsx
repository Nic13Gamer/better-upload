'use client';

import { toast } from 'sonner';
import { UploadButton } from './ui/upload-button';

export function FileUploader() {
  return (
    <UploadButton
      route="image"
      accept="image/*"
      onUploadComplete={({ file }) => {
        toast.success(`Uploaded ${file.name}`);
      }}
      onUploadBegin={({ file }) => {
        toast.info(`Uploading ${file.name}`);
      }}
      onUploadError={(error) => {
        toast.error(error.message);
      }}
    />
  );
}
