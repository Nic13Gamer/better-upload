'use client';

import { useUploadFiles } from '@better-upload/client';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { PasteUploadArea } from './ui/paste-upload-area';

export function PasteUploader() {
  const { control, isPending } = useUploadFiles({
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
    <div className="space-y-6">
      <Input placeholder="No upload" />
      <PasteUploadArea control={control}>
        <Input placeholder="Paste to upload" disabled={isPending} />
      </PasteUploadArea>
    </div>
  );
}
