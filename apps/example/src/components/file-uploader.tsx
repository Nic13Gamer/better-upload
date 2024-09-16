'use client';

import { toast } from 'sonner';
import { UploadButton } from './templates/upload-button';

export function FileUploader() {
  return (
    <UploadButton
      route="image"
      accept="image/*"
      onUploadComplete={({ file }) => {
        toast.success(`Uploaded ${file.name}`);
      }}
    />
  );
}
