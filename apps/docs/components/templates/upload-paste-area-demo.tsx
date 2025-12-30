'use client';

import { cn } from '@/lib/utils';
import { Clipboard, Upload, X } from 'lucide-react';

function formatBytes(bytes: number) {
  const threshold = 1000;
  const units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB'];

  if (bytes < threshold) {
    return `${bytes} ${units[0]}`;
  }

  const exponent = Math.floor(Math.log(bytes) / Math.log(threshold));
  const unit = units[exponent];
  const value = (bytes / Math.pow(threshold, exponent)).toFixed(0);

  return `${value} ${unit}`;
}
import { useCallback, useEffect, useId, useState } from 'react';
import { toast } from 'sonner';

type PastedFile = {
  file: File;
  preview: string | null;
};

export function UploadPasteAreaDemo() {
  const id = useId();
  const [isFocused, setIsFocused] = useState(false);
  const [pastedFiles, setPastedFiles] = useState<PastedFile[]>([]);

  useEffect(() => {
    return () => {
      pastedFiles.forEach((pf) => {
        if (pf.preview) {
          URL.revokeObjectURL(pf.preview);
        }
      });
    };
  }, [pastedFiles]);

  const handlePaste = useCallback((event: React.ClipboardEvent) => {
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const files: File[] = [];

    if (clipboardData.files.length > 0) {
      for (let i = 0; i < clipboardData.files.length; i++) {
        const file = clipboardData.files[i];
        if (file) files.push(file);
      }
    }

    if (files.length === 0 && clipboardData.items) {
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
    }

    if (files.length > 0) {
      event.preventDefault();

      const newPastedFiles: PastedFile[] = files.map((file) => ({
        file,
        preview: file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : null,
      }));

      setPastedFiles((prev) => [...prev, ...newPastedFiles]);
      toast.info(`Added ${files.length} file${files.length > 1 ? 's' : ''}.`);
    }
  }, []);

  const handleUpload = useCallback(() => {
    if (pastedFiles.length === 0) return;
    toast.success(
      `Uploading ${pastedFiles.length} file${pastedFiles.length > 1 ? 's' : ''}...`
    );
    pastedFiles.forEach((pf) => {
      if (pf.preview) URL.revokeObjectURL(pf.preview);
    });
    setPastedFiles([]);
  }, [pastedFiles]);

  const handleClear = useCallback(() => {
    pastedFiles.forEach((pf) => {
      if (pf.preview) URL.revokeObjectURL(pf.preview);
    });
    setPastedFiles([]);
  }, [pastedFiles]);

  const handleRemoveFile = useCallback((index: number) => {
    setPastedFiles((prev) => {
      const file = prev[index];
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const hasFiles = pastedFiles.length > 0;

  return (
    <div className="not-prose flex flex-col gap-3">
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
            'dark:bg-input/10 hover:bg-accent dark:hover:bg-accent/40 flex w-full min-w-72 cursor-text flex-col items-center justify-center rounded-lg bg-transparent px-2 py-6 transition-colors'
          )}
          tabIndex={0}
          id={id}
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
              You can upload 4 files. Each up to 2MB. Accepted JPEG, PNG, GIF.
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

      {hasFiles && (
        <div className="grid gap-2">
          {pastedFiles.map((pastedFile, index) => (
            <div
              key={`${pastedFile.file.name}-${index}`}
              className="dark:bg-input/10 flex items-center gap-3 rounded-lg border bg-transparent p-3"
            >
              {pastedFile.preview ? (
                <img
                  src={pastedFile.preview}
                  alt={pastedFile.file.name}
                  className="size-12 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="bg-muted flex size-12 shrink-0 items-center justify-center rounded">
                  <span className="text-muted-foreground text-xs font-semibold">
                    FILE
                  </span>
                </div>
              )}

              <div className="grid min-w-0 grow gap-0.5">
                <p className="truncate text-sm font-medium">
                  {pastedFile.file.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatBytes(pastedFile.file.size)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="hover:bg-accent rounded-md p-2 transition-colors"
                aria-label={`Remove ${pastedFile.file.name}`}
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {hasFiles && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleUpload}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex grow items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            <Upload className="size-4" />
            Upload {pastedFiles.length} file{pastedFiles.length !== 1 ? 's' : ''}
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="hover:bg-accent inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
