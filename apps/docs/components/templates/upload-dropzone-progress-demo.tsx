import { Dot, File, Upload } from 'lucide-react';
import { Progress } from '../ui/progress';

export function UploadDropzoneProgressDemo() {
  return (
    <div className="not-prose flex flex-col gap-3">
      <div className="bg-fd-muted/5 hover:dark:bg-fd-muted/15 hover:bg-fd-muted/30 dark:bg-fd-background flex min-w-80 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-2 py-6 transition-colors">
        <div className="my-2">
          <Upload className="size-6" />
        </div>

        <div className="mt-3 space-y-1 text-center">
          <p className="text-sm font-semibold">Drag and drop files here</p>

          <p className="text-fd-muted-foreground max-w-64 text-xs">
            You can upload 4 files. Each up to 20MB. Accepted JPEG, PDF.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2.5 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <FileIcon caption="PDF" />

            <div className="space-y-1">
              <p className="text-sm font-medium">invoice_123.pdf</p>

              <div className="flex items-center gap-0.5 text-xs">
                <p className="text-muted-foreground">2 MB</p>

                <Dot className="text-muted-foreground size-4" />

                <p>Completed</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <FileIcon caption="IMG" />

            <div className="space-y-1">
              <p className="text-sm font-medium">photo.jpeg</p>

              <div className="flex items-center gap-0.5 text-xs">
                <p className="text-muted-foreground">12 MB</p>

                <Dot className="text-muted-foreground size-4" />

                <p>70%</p>
              </div>
            </div>
          </div>

          <Progress className="h-1.5" value={70} />
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
