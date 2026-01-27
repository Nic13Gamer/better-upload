'use client';

import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useId } from 'react';
import { toast } from 'sonner';

export function UploadButtonDemo() {
  const id = useId();

  return (
    <Button className="relative" type="button">
      <label htmlFor={id} className="absolute inset-0 cursor-pointer">
        <input
          id={id}
          className="absolute inset-0 size-0 opacity-0"
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              toast.info(`You selected ${e.target.files[0].name}.`);
            }
            e.target.value = '';
          }}
        />
      </label>
      <Upload className="size-4" />
      Upload file
    </Button>
  );
}
