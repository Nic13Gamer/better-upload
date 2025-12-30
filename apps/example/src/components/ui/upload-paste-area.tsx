'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UploadHookControl } from '@better-upload/client';
import { formatBytes } from '@better-upload/client/helpers';
import { Clipboard, Loader2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

type PastedFile = {
  file: File;
  preview: string | null;
};

type UploadPasteAreaProps = {
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

export function UploadPasteArea({
  control: { upload, isPending },
  id: _id,
  accept,
  metadata,
  description,
  uploadOverride,
}: UploadPasteAreaProps) {
  const id = useId();
  const [isFocused, setIsFocused] = useState(false);
  const [pastedFiles, setPastedFiles] = useState<PastedFile[]>([]);

  // Clean up object URLs on unmount or when files change
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

  return (
    <div className="text-foreground flex flex-col gap-3">
      {/* Paste Area */}
      <div
        className={cn(
          'border-input relative rounded-lg border border-dashed transition-colors',
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
            {isPending ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <Clipboard className="size-6" />
            )}
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

      {/* File Previews */}
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
                <div className="bg-muted flex size-12 shrink-0 items-center justify-center rounded">
                  <FileTypeIcon type={pastedFile.file.type} />
                </div>
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
    </div>
  );
}

function FileTypeIcon({ type }: { type: string }) {
  const label = useMemo(() => {
    const iconCaptions: Record<string, string> = {
      'image/': 'IMG',
      'video/': 'VID',
      'audio/': 'AUD',
      'application/pdf': 'PDF',
      'application/zip': 'ZIP',
      'text/': 'TXT',
    };

    return (
      Object.entries(iconCaptions).find(([key]) => type.startsWith(key))?.[1] ||
      'FILE'
    );
  }, [type]);

  return (
    <span className="text-muted-foreground text-xs font-semibold">{label}</span>
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
