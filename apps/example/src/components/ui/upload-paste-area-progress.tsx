'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { UploadHookControl } from '@better-upload/client';
import { formatBytes } from '@better-upload/client/helpers';
import { Clipboard, Dot, File, Loader2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';

type PastedFile = {
  file: File;
  preview: string | null;
};

type UploadPasteAreaProgressProps = {
  control: UploadHookControl<true>;
  id?: string;
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

export function UploadPasteAreaProgress({
  control: { upload, isPending, progresses },
  id: _id,
  accept,
  metadata,
  description,
  uploadOverride,
}: UploadPasteAreaProgressProps) {
  const id = useId();
  const [isFocused, setIsFocused] = useState(false);
  const [pastedFiles, setPastedFiles] = useState<PastedFile[]>([]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      pastedFiles.forEach((pf) => {
        if (pf.preview) {
          URL.revokeObjectURL(pf.preview);
        }
      });
    };
  }, [pastedFiles]);

  const handlePaste = useCallback(
    (event: React.ClipboardEvent) => {
      if (isPending) return;

      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      const files: File[] = [];

      // Extract files from clipboard
      if (clipboardData.files.length > 0) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i];
          if (file) {
            if (accept && !matchesAccept(file, accept)) {
              continue;
            }
            files.push(file);
          }
        }
      }

      // Handle image data from clipboard items (e.g., screenshots)
      if (files.length === 0 && clipboardData.items) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) {
              if (accept && !matchesAccept(file, accept)) {
                continue;
              }
              files.push(file);
            }
          }
        }
      }

      if (files.length > 0) {
        event.preventDefault();

        // Create previews for image files
        const newPastedFiles: PastedFile[] = files.map((file) => ({
          file,
          preview: file.type.startsWith('image/')
            ? URL.createObjectURL(file)
            : null,
        }));

        setPastedFiles((prev) => [...prev, ...newPastedFiles]);
      }
    },
    [isPending, accept]
  );

  const handleUpload = useCallback(() => {
    if (pastedFiles.length === 0 || isPending) return;

    const files = pastedFiles.map((pf) => pf.file);

    if (uploadOverride) {
      uploadOverride(files, { metadata });
    } else {
      upload(files, { metadata });
    }

    // Clear files after upload starts
    pastedFiles.forEach((pf) => {
      if (pf.preview) {
        URL.revokeObjectURL(pf.preview);
      }
    });
    setPastedFiles([]);
  }, [pastedFiles, isPending, metadata, upload, uploadOverride]);

  const handleClear = useCallback(() => {
    pastedFiles.forEach((pf) => {
      if (pf.preview) {
        URL.revokeObjectURL(pf.preview);
      }
    });
    setPastedFiles([]);
  }, [pastedFiles]);

  const handleRemoveFile = useCallback((index: number) => {
    setPastedFiles((prev) => {
      const file = prev[index];
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const hasFiles = pastedFiles.length > 0;
  const hasProgress = progresses.length > 0;

  return (
    <div className="text-foreground flex flex-col gap-3">
      {/* Paste Area */}
      <div
        className={cn(
          'relative rounded-lg border border-dashed transition-colors',
          {
            'border-primary/80': isFocused,
          }
        )}
      >
        <div
          className={cn(
            'dark:bg-input/10 flex w-full min-w-72 cursor-text flex-col items-center justify-center rounded-lg bg-transparent px-2 py-6 transition-colors',
            {
              'text-muted-foreground cursor-not-allowed': isPending,
              'hover:bg-accent dark:hover:bg-accent/40': !isPending,
            }
          )}
          tabIndex={0}
          id={_id || id}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onPaste={handlePaste}
          role="textbox"
          aria-label="Paste area for file uploads"
        >
          <div className="my-2">
            <Clipboard className="size-6" />
          </div>

          <div className="mt-3 space-y-1 text-center">
            <p className="text-sm font-semibold">
              {isFocused ? 'Paste files now' : 'Click here and paste files'}
            </p>

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

            <p className="text-muted-foreground text-xs">
              {isFocused ? (
                <kbd className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                  Ctrl+V
                </kbd>
              ) : (
                'Supports images and files from clipboard'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Staged Files (before upload) */}
      {hasFiles && (
        <div className="grid gap-2">
          {pastedFiles.map((pastedFile, index) => (
            <div
              key={`${pastedFile.file.name}-${index}`}
              className="dark:bg-input/10 flex items-center gap-3 rounded-lg border bg-transparent p-3"
            >
              {/* Preview */}
              {pastedFile.preview ? (
                <img
                  src={pastedFile.preview}
                  alt={pastedFile.file.name}
                  className="size-12 shrink-0 rounded object-cover"
                />
              ) : (
                <FileIcon type={pastedFile.file.type} />
              )}

              {/* File Info */}
              <div className="grid min-w-0 grow gap-0.5">
                <p className="truncate text-sm font-medium">
                  {pastedFile.file.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatBytes(pastedFile.file.size)}
                </p>
              </div>

              {/* Remove Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRemoveFile(index)}
                disabled={isPending}
                aria-label={`Remove ${pastedFile.file.name}`}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {hasFiles && (
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleUpload}
            disabled={isPending}
            className="grow"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="size-4" />
                Upload {pastedFiles.length} file
                {pastedFiles.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={isPending}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Upload Progress */}
      {hasProgress && (
        <div className="grid gap-2">
          {progresses.map((progress) => (
            <div
              key={progress.objectInfo.key}
              className={cn(
                'dark:bg-input/10 flex items-center gap-2 rounded-lg border bg-transparent p-3',
                {
                  'bg-red-500/[0.04]! border-red-500/60':
                    progress.status === 'failed',
                }
              )}
            >
              <FileIcon type={progress.type} />

              <div className="grid grow gap-1">
                <div className="flex items-center gap-0.5">
                  <p className="max-w-40 truncate text-sm font-medium">
                    {progress.name}
                  </p>
                  <Dot className="text-muted-foreground size-4" />
                  <p className="text-muted-foreground text-xs">
                    {formatBytes(progress.size)}
                  </p>
                </div>

                <div className="flex h-4 items-center">
                  {progress.progress < 1 && progress.status !== 'failed' ? (
                    <Progress className="h-1.5" value={progress.progress * 100} />
                  ) : progress.status === 'failed' ? (
                    <p className="text-xs text-red-500">Failed</p>
                  ) : (
                    <p className="text-muted-foreground text-xs">Completed</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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

/**
 * Check if a file matches the accept string pattern
 */
function matchesAccept(file: File, accept: string): boolean {
  const acceptTypes = accept.split(',').map((type) => type.trim());

  for (const acceptType of acceptTypes) {
    // Handle wildcards like "image/*"
    if (acceptType.endsWith('/*')) {
      const prefix = acceptType.slice(0, -1);
      if (file.type.startsWith(prefix)) {
        return true;
      }
    }
    // Handle exact MIME types like "image/png"
    else if (file.type === acceptType) {
      return true;
    }
    // Handle file extensions like ".png"
    else if (acceptType.startsWith('.')) {
      const extension = file.name.toLowerCase().split('.').pop();
      if (extension && `.${extension}` === acceptType.toLowerCase()) {
        return true;
      }
    }
  }

  return false;
}
