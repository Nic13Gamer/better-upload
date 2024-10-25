import { cn } from '@/lib/utils';
import { useUploadFiles } from 'better-upload/client';
import { Loader2, Upload } from 'lucide-react';
import { useId } from 'react';
import { useDropzone } from 'react-dropzone';

type UploadDropzoneProps = Parameters<typeof useUploadFiles>[0] & {
  accept?: string;
  metadata?: Record<string, unknown>;

  description?:
    | {
        fileTypes?: string;
        maxFileSize?: string;
        maxFiles?: number;
      }
    | string;

  // Add any additional props you need.
};

export function UploadDropzone({
  accept,
  metadata,
  description,
  ...params
}: UploadDropzoneProps) {
  const id = useId();

  const { upload, isPending } = useUploadFiles({
    ...params,
    onUploadSettled: () => {
      if (inputRef.current) {
        inputRef.current.value = '';
      }

      params.onUploadSettled?.();
    },
  });

  const { getRootProps, getInputProps, isDragActive, inputRef } = useDropzone({
    onDrop: (files) => {
      if (files.length > 0) {
        upload(files, { metadata });
      }
    },
    noClick: true,
  });

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 border-dashed transition-colors',
        {
          'border-foreground/60': isDragActive,
        }
      )}
    >
      <label
        {...getRootProps()}
        className={cn(
          'bg-muted/5 flex w-full min-w-64 cursor-pointer flex-col items-center justify-center px-2 py-6 transition-colors',
          {
            'bg-muted/15 text-muted-foreground cursor-not-allowed': isPending,
            'hover:dark:bg-muted/20 hover:bg-muted/25': !isPending,
          }
        )}
        htmlFor={id}
      >
        <div className="bg-background rounded-full border border-dashed p-2.5">
          {isPending ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <Upload className="size-6" />
          )}
        </div>

        <div className="mt-2.5 space-y-1 text-center">
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
          <div className="bg-muted/10 flex size-full flex-col items-center justify-center">
            <div className="bg-background rounded-full border border-dashed p-2.5">
              <Upload className="size-6" />
            </div>

            <p className="mt-2.5 text-sm font-semibold">Drop files here</p>
          </div>
        </div>
      )}
    </div>
  );
}
