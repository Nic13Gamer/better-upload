import { cn } from '@/lib/utils';
import { type UploadedFile, useUploadFiles } from 'better-upload/client';
import { readableBytes } from 'better-upload/client/helpers';
import { Dot, File, Upload } from 'lucide-react';
import { useId, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Progress } from './progress';

type UploadDropzoneProgressProps = Parameters<typeof useUploadFiles>[0] & {
  accept?: string;
  metadata?: Record<string, unknown>;

  description?:
    | {
        fileTypes?: string;
        maxFileSize?: string;
        maxFiles?: number;
      }
    | string;

  resetAfterSettled?: boolean;

  // Add any additional props you need.
};

export function UploadDropzoneProgress({
  accept,
  metadata,
  description,
  resetAfterSettled,
  ...params
}: UploadDropzoneProgressProps) {
  const id = useId();

  const [progresses, setProgresses] = useState<
    { file: Omit<UploadedFile, 'raw'>; progress: number; failed: boolean }[]
  >([]);

  const { upload, reset, isPending } = useUploadFiles({
    ...params,
    onUploadSettled: () => {
      if (inputRef.current) {
        inputRef.current.value = '';
      }

      if (resetAfterSettled) {
        setProgresses([]);
        reset();
      }

      params.onUploadSettled?.();
    },
    onBeforeUpload: (args) => {
      setProgresses([]);

      return params.onBeforeUpload?.(args);
    },
    onUploadProgress: ({ file, progress }) => {
      setProgresses((prev) => {
        const existing = prev.find((p) => p.file.objectKey === file.objectKey);
        if (existing) {
          return prev.map((p) =>
            p.file.objectKey === file.objectKey ? { ...p, progress } : p
          );
        }

        return [...prev, { file, progress, failed: false }];
      });

      params.onUploadProgress?.({ file, progress });
    },
    onUploadError: (error) => {
      setProgresses((prev) =>
        prev.map((p) =>
          error.objectKeys?.includes(p.file.objectKey)
            ? { ...p, failed: true }
            : p
        )
      );

      params.onUploadError?.(error);
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
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          'relative rounded-lg border border-dashed transition-colors',
          {
            'border-primary/70': isDragActive,
          }
        )}
      >
        <label
          {...getRootProps()}
          className={cn(
            'bg-muted/5 dark:bg-background flex w-full min-w-80 cursor-pointer flex-col items-center justify-center rounded-lg px-2 py-6 transition-colors',
            {
              'bg-muted/20 text-muted-foreground cursor-not-allowed': isPending,
              'hover:dark:bg-muted/15 hover:bg-muted/30': !isPending,
            }
          )}
          htmlFor={id}
        >
          <div className="my-2">
            <Upload className="size-6" />
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
                  {description?.fileTypes &&
                    `Accepted ${description.fileTypes}.`}
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
            <div className="bg-muted/15 flex size-full flex-col items-center justify-center rounded-lg">
              <div className="my-2">
                <Upload className="size-6" />
              </div>

              <p className="mt-3 text-sm font-semibold">Drop files here</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {progresses.map((progress) => (
          <div
            key={progress.file.objectKey}
            className={cn('flex flex-col gap-2.5 rounded-lg border p-3', {
              'border-red-500/70 bg-red-500/[0.03]': progress.failed,
            })}
          >
            <div className="flex items-center gap-2">
              <FileIcon type={progress.file.type} />

              <div className="space-y-1">
                <p className="text-sm font-medium">{progress.file.name}</p>

                <div className="flex items-center gap-0.5 text-xs">
                  <p className="text-muted-foreground">
                    {readableBytes(progress.file.size)}
                  </p>

                  <Dot className="text-muted-foreground size-4" />

                  <p>
                    {progress.failed ? (
                      <span className="text-red-500">Failed</span>
                    ) : progress.progress < 1 ? (
                      `${(progress.progress * 100).toFixed(0)}%`
                    ) : (
                      'Completed'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {progress.progress < 1 && !progress.failed && (
              <Progress className="h-1.5" value={progress.progress * 100} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const iconCaptions = {
  'image/': 'IMG',
  'video/': 'VID',
  'audio/': 'AUD',
  'application/pdf': 'PDF',
  'application/zip': 'ZIP',
  'application/x-rar-compressed': 'RAR',
  'application/x-7z-compressed': '7Z',
  'application/x-tar': 'TAR',
  'application/json': 'JSON',
  'application/javascript': 'JS',
  'text/plain': 'TXT',
  'text/csv': 'CSV',
  'text/html': 'HTML',
  'text/css': 'CSS',
  'application/xml': 'XML',
  'application/x-sh': 'SH',
  'application/x-python-code': 'PY',
  'application/x-executable': 'EXE',
  'application/x-disk-image': 'ISO',
};

function FileIcon({ type }: { type: string }) {
  const caption = Object.entries(iconCaptions).find(([key]) =>
    type.startsWith(key)
  )?.[1];

  return (
    <div className="relative shrink-0">
      <File className="text-muted-foreground size-12" strokeWidth={1} />

      {caption && (
        <span className="bg-primary text-primary-foreground absolute bottom-2.5 left-0.5 select-none rounded px-1 py-px text-xs font-semibold">
          {caption}
        </span>
      )}
    </div>
  );
}
