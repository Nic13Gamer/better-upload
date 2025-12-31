'use client';

import { toast } from 'sonner';
import { Input } from '../ui/input';

export function PasteUploadAreaDemo() {
  return (
    <div
      onPasteCapture={(e) => {
        const files = e.clipboardData.files;
        toast.info(
          `You pasted ${files.length} file${files.length !== 1 ? 's' : ''}.`
        );
      }}
    >
      <Input placeholder="Paste to upload" className="w-64" />
    </div>
  );
}
