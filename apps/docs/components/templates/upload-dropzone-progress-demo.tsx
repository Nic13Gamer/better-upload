'use client';

import { Dot, File } from 'lucide-react';
import { Progress } from '../ui/progress';
import { UploadDropzoneDemo } from './upload-dropzone-demo';

export function UploadDropzoneProgressDemo() {
  return (
    <div className="not-prose flex flex-col gap-3">
      <UploadDropzoneDemo />

      <div className="grid gap-2">
        <div className="dark:bg-input/10 flex items-center gap-2 rounded-lg border bg-transparent p-3">
          <FileIcon caption="PDF" />

          <div className="grid grow gap-1">
            <div className="flex items-center gap-0.5">
              <p className="max-w-40 truncate text-sm font-medium">
                invoice_123.pdf
              </p>
              <Dot className="text-muted-foreground size-4" />
              <p className="text-muted-foreground text-xs">2 MB</p>
            </div>

            <div className="flex h-4 items-center">
              <p className="text-muted-foreground text-xs">Completed</p>
            </div>
          </div>
        </div>

        <div className="dark:bg-input/10 flex items-center gap-2 rounded-lg border bg-transparent p-3">
          <FileIcon caption="IMG" />

          <div className="grid grow gap-1">
            <div className="flex items-center gap-0.5">
              <p className="max-w-40 truncate text-sm font-medium">
                photo.jpeg
              </p>
              <Dot className="text-muted-foreground size-4" />
              <p className="text-muted-foreground text-xs">12 MB</p>
            </div>

            <div className="flex h-4 items-center">
              <Progress className="h-1.5" value={70} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileIcon({ caption }: { caption: string }) {
  return (
    <div className="relative shrink-0">
      <File className="text-muted-foreground size-12" strokeWidth={1} />

      <span className="bg-primary text-primary-foreground absolute bottom-2.5 left-0.5 select-none rounded px-1 py-px text-xs font-semibold">
        {caption}
      </span>
    </div>
  );
}
