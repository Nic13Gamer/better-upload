'use client';

import { cn } from '@/lib/utils';
import { Upload } from 'lucide-react';
import { useId } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

export function UploadDropzoneDemo() {
  const id = useId();

  const { getRootProps, getInputProps, isDragActive, inputRef } = useDropzone({
    onDrop: (files) => {
      toast.info(
        `You dropped ${files.length} file${files.length > 1 ? 's' : ''}.`
      );
    },
    noClick: true,
  });

  return (
    <div
      className={cn(
        'not-prose border-input relative rounded-lg border border-dashed transition-colors',
        {
          'border-primary/80': isDragActive,
        }
      )}
    >
      <label
        {...getRootProps()}
        className={cn(
          'dark:bg-input/10 flex w-full min-w-72 cursor-pointer flex-col items-center justify-center rounded-lg bg-transparent px-2 py-6 transition-colors'
        )}
        htmlFor={id}
      >
        <div className="my-2">
          <Upload className="size-6" />
        </div>

        <div className="mt-3 space-y-1 text-center">
          <p className="text-sm font-semibold">Drag and drop files here</p>

          <p className="text-muted-foreground max-w-64 text-xs">
            You can upload 4 files. Each up to 2MB. Accepted JPEG, PNG, GIF.
          </p>
        </div>

        <input
          {...getInputProps()}
          type="file"
          multiple
          id={id}
          accept="image/*"
        />
      </label>

      {isDragActive && (
        <div className="bg-background pointer-events-none absolute inset-0 rounded-lg">
          <div className="dark:bg-accent/30 bg-accent flex size-full flex-col items-center justify-center rounded-lg">
            <div className="my-2">
              <Upload className="size-6" />
            </div>

            <p className="mt-3 text-sm font-semibold">Drop files here</p>
          </div>
        </div>
      )}
    </div>
  );
}
