import { cn } from '@/lib/utils';
import { Loader2, Upload } from 'lucide-react';
import {
  useUploadFiles,
  type ClientUploadFileError,
  type UploadedFile,
} from 'next-upload/client';
import { useId } from 'react';
import { useDropzone } from 'react-dropzone';

type UploadDropzoneProps = {
  route: string;
  accept?: string;

  cosmetic?: {
    fileTypes?: string;
    maxFileSize?: string;
    maxFiles?: number;
  };

  onUploadComplete?: (data: {
    files: UploadedFile[];
    metadata: Record<string, unknown>;
  }) => void;
  onUploadError?: (error: ClientUploadFileError) => void;

  // Add any additional props you need.
};

export function UploadDropzone({
  route,
  accept,
  cosmetic,
  onUploadComplete,
  onUploadError,
}: UploadDropzoneProps) {
  const id = useId();

  const { upload, isPending } = useUploadFiles({
    route,
    onSuccess: onUploadComplete,
    onError: onUploadError,

    // Add any additional configuration, like `sequential`.
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      upload(files);
    },
    noClick: true,
  });
  return (
    <div className="relative rounded-lg border-2 border-dashed">
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
        <div className="rounded-full border border-dashed p-2.5">
          {isPending ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <Upload className="size-6" />
          )}
        </div>

        <div className="mt-2.5 space-y-1 text-center">
          <p className="text-sm font-semibold">Drag and drop files here</p>
          <p className="text-muted-foreground max-w-64 text-xs">
            {cosmetic?.maxFiles && `You can upload ${cosmetic.maxFiles} files.`}{' '}
            {cosmetic?.maxFileSize && `Each up to ${cosmetic.maxFileSize}.`}{' '}
            {cosmetic?.fileTypes && `Accepted ${cosmetic.fileTypes}.`}
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

      {/* TODO: improve this UI */}
      {isDragActive && (
        <div className="bg-background pointer-events-none absolute inset-0 rounded-lg">
          <div className="bg-muted/10 flex size-full items-center justify-center">
            <p>Drop files here</p>
          </div>
        </div>
      )}
    </div>
  );
}
