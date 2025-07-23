import { cn } from '@/lib/utils';
import type { UploadHookControl } from 'better-upload/client';
import { Loader2, Upload } from 'lucide-react';
import { useId } from 'react';
import { useDropzone } from 'react-dropzone';

type UploadDropzoneProps = {
  control: UploadHookControl<true>;
  accept?: string;
  metadata?: Record<string, unknown>;
  description?:
    | {
        fileTypes?: string;
        maxFileSize?: string;
        maxFiles?: number;
      }
    | string;
  uploadOverride?: (
    ...args: Parameters<UploadHookControl<true>['upload']>
  ) => void;

  // Add any additional props you need.
};

export function UploadDropzone({
  control: { upload, isPending },
  accept,
  metadata,
  description,
  uploadOverride,
}: UploadDropzoneProps) {
  const id = useId();

  const { getRootProps, getInputProps, isDragActive, inputRef } = useDropzone({
    onDrop: (files) => {
      if (files.length > 0 && !isPending) {
        if (uploadOverride) {
          uploadOverride(files, { metadata });
        } else {
          upload(files, { metadata });
        }
      }
      inputRef.current.value = '';
    },
    noClick: true,
  });

  return (
    <div
      className={cn(
        'border-input relative rounded-lg border border-dashed transition-colors',
        {
          'border-primary/80': isDragActive,
        }
      )}
    >
      <label
        {...getRootProps()}
        className={cn(
          'dark:bg-input/10 flex w-full min-w-72 cursor-pointer flex-col items-center justify-center rounded-lg bg-transparent px-2 py-6 transition-colors',
          {
            'text-muted-foreground cursor-not-allowed': isPending,
            'hover:bg-accent dark:hover:bg-accent/30': !isPending,
          }
        )}
        htmlFor={id}
      >
        <div className="my-2">
          {isPending ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <Upload className="size-6" />
          )}
        </div>

        <div className="mt-3 space-y-1 text-center">
          <p className="text-sm font-semibold">Drag and drop files here</p>

          <p className="text-muted-foreground max-w-64 text-xs">
            {typeof description === 'string' ? (
              description
            ) : (
              <>
                {description?.maxFiles &&
                  `You can upload ${description.maxFiles} file${description.maxFiles !== 1 ? 's' : ''}.`}{' '}
                {description?.maxFileSize &&
                  `${description.maxFiles !== 1 ? 'Each u' : 'U'}p to ${description.maxFileSize}.`}{' '}
                {description?.fileTypes && `Accepted ${description.fileTypes}.`}
              </>
            )}
          </p>
        </div>

        <input
          {...getInputProps()}
          type="file"
          multiple
          id={id}
          accept={accept}
          disabled={isPending}
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
