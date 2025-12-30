'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UploadHookControl } from '@better-upload/client';
import { ImagePlus, Loader2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

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

type PastedFile = {
  file: File;
  preview: string | null;
};

type UploadPasteAreaProps = {
  control: UploadHookControl<true>;
  id?: string;
  accept?: string;
  metadata?: Record<string, unknown>;
  description?: string;
  uploadOverride?: (
    ...args: Parameters<UploadHookControl<true>['upload']>
  ) => void;
};

export function UploadPasteArea({
  control: { upload, isPending, progresses },
  id: _id,
  accept,
  metadata,
  description = 'Images up to 2MB',
  uploadOverride,
}: UploadPasteAreaProps) {
  const id = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [files, setFiles] = useState<PastedFile[]>([]);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    };
  }, [files]);

  const addFiles = useCallback((newFiles: File[]) => {
    const pastedFiles: PastedFile[] = newFiles
      .filter((file) => !accept || matchesAccept(file, accept))
      .map((file) => ({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      }));
    setFiles((prev) => [...prev, ...pastedFiles]);
  }, [accept]);

  const handlePaste = useCallback(
    (event: React.ClipboardEvent) => {
      if (isPending) return;
      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      const pastedFiles: File[] = [];

      // Check for files
      if (clipboardData.files.length > 0) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i];
          if (file) pastedFiles.push(file);
        }
      }

      // Check clipboard items (screenshots)
      if (pastedFiles.length === 0 && clipboardData.items) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) pastedFiles.push(file);
          }
        }
      }

      // Check for pasted URLs
      if (pastedFiles.length === 0) {
        const text = clipboardData.getData('text');
        if (text) {
          const urls = text.split(/[\n,\s]+/).filter((u) => {
            try {
              const url = new URL(u.trim());
              return url.protocol === 'http:' || url.protocol === 'https:';
            } catch {
              return false;
            }
          });

          if (urls.length > 0) {
            event.preventDefault();
            fetchUrls(urls);
            return;
          }
        }
      }

      if (pastedFiles.length > 0) {
        event.preventDefault();
        addFiles(pastedFiles);
      }
    },
    [isPending, addFiles]
  );

  const fetchUrls = async (urls: string[]) => {
    setIsLoadingUrl(true);
    const results = await Promise.all(
      urls.map(async (url): Promise<PastedFile | null> => {
        try {
          const response = await fetch(url);
          if (!response.ok) return null;
          const blob = await response.blob();
          const filename = url.split('/').pop()?.split('?')[0] || 'image';
          const ext = blob.type.split('/')[1] || 'png';
          const file = new File([blob], `${filename}.${ext}`, { type: blob.type });
          if (accept && !matchesAccept(file, accept)) return null;
          return {
            file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
          };
        } catch {
          return null;
        }
      })
    );
    const valid = results.filter((r): r is PastedFile => r !== null);
    if (valid.length > 0) setFiles((prev) => [...prev, ...valid]);
    setIsLoadingUrl(false);
  };

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      if (selected.length > 0) addFiles(selected);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [addFiles]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const file = prev[index];
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const clearAll = useCallback(() => {
    files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    setFiles([]);
  }, [files]);

  const handleUpload = useCallback(() => {
    if (files.length === 0 || isPending) return;
    const toUpload = files.map((f) => f.file);
    if (uploadOverride) {
      uploadOverride(toUpload, { metadata });
    } else {
      upload(toUpload, { metadata });
    }
    clearAll();
  }, [files, isPending, metadata, upload, uploadOverride, clearAll]);

  const hasFiles = files.length > 0;

  // Calculate upload progress stats
  const uploadingCount = progresses.filter((p) => p.status === 'uploading').length;
  const completedCount = progresses.filter((p) => p.status === 'complete').length;
  const totalCount = progresses.length;
  const overallProgress = totalCount > 0
    ? Math.round(progresses.reduce((acc, p) => acc + p.progress, 0) / totalCount * 100)
    : 0;

  return (
    <div className="text-foreground w-full max-w-md space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Drop/Paste Zone */}
      <div
        className={cn(
          'border-input group relative rounded-xl border-2 border-dashed transition-all',
          isFocused && 'border-primary bg-primary/5',
          isPending && 'pointer-events-none opacity-60'
        )}
      >
        <div
          tabIndex={0}
          id={_id || id}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onPaste={handlePaste}
          onClick={() => !isPending && fileInputRef.current?.click()}
          role="button"
          aria-label="Upload area"
          className="flex cursor-pointer flex-col items-center gap-2 px-4 py-8"
        >
          {isPending || isLoadingUrl ? (
            <Loader2 className="text-muted-foreground size-8 animate-spin" />
          ) : (
            <div className="bg-primary/10 text-primary rounded-full p-3">
              <ImagePlus className="size-6" />
            </div>
          )}

          <div className="text-center">
            <p className="text-sm font-medium">
              {isLoadingUrl
                ? 'Loading from URL...'
                : isFocused
                  ? 'Press Ctrl+V to paste'
                  : 'Click to browse or paste'}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {description} • Paste files or image URLs
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {isPending && totalCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              Uploading {completedCount + 1} of {totalCount}...
            </span>
            <span className="text-muted-foreground">{overallProgress}%</span>
          </div>
          <div className="bg-secondary h-2 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {progresses.map((p) => (
              <div
                key={p.objectInfo.key}
                className={cn(
                  'relative aspect-square overflow-hidden rounded-md border',
                  p.status === 'complete' && 'ring-2 ring-green-500',
                  p.status === 'failed' && 'ring-2 ring-red-500'
                )}
              >
                <div className="bg-muted flex size-full items-center justify-center">
                  <span className="text-muted-foreground text-[10px] font-medium">
                    {p.name.split('.').pop()?.toUpperCase()}
                  </span>
                </div>
                {p.status === 'uploading' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-xs font-medium text-white">
                      {Math.round(p.progress * 100)}%
                    </span>
                  </div>
                )}
                {p.status === 'complete' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                    <span className="text-xs">✓</span>
                  </div>
                )}
                {p.status === 'failed' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                    <span className="text-xs">✗</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Grid */}
      {hasFiles && !isPending && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium">
              {files.length} file{files.length !== 1 && 's'} selected
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="text-muted-foreground hover:text-destructive text-xs transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {files.map((f, i) => (
              <div
                key={`${f.file.name}-${i}`}
                className="group relative aspect-square overflow-hidden rounded-lg border"
              >
                {f.preview ? (
                  <img
                    src={f.preview}
                    alt={f.file.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="bg-muted flex size-full items-center justify-center">
                    <span className="text-muted-foreground text-xs font-medium">
                      {f.file.name.split('.').pop()?.toUpperCase()}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="size-3 text-white" />
                </button>
                <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5">
                  <p className="truncate text-[10px] text-white">{formatBytes(f.file.size)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={isPending}
            className="w-full"
          >
            <Upload className="size-4" />
            Upload {files.length} file{files.length !== 1 && 's'}
          </Button>
        </div>
      )}
    </div>
  );
}

function matchesAccept(file: File, accept: string): boolean {
  const acceptTypes = accept.split(',').map((t) => t.trim());

  for (const type of acceptTypes) {
    if (type.endsWith('/*')) {
      if (file.type.startsWith(type.slice(0, -1))) return true;
    } else if (file.type === type) {
      return true;
    } else if (type.startsWith('.')) {
      const ext = file.name.toLowerCase().split('.').pop();
      if (ext && `.${ext}` === type.toLowerCase()) return true;
    }
  }

  return false;
}
