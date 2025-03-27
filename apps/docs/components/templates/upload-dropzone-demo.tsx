import { Upload } from 'lucide-react';

export function UploadDropzoneDemo() {
  return (
    <div className="not-prose bg-fd-muted/5 hover:dark:bg-fd-muted/15 hover:bg-fd-muted/30 dark:bg-fd-background flex min-w-64 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-2 py-6 transition-colors">
      <div className="my-2">
        <Upload className="size-6" />
      </div>

      <div className="mt-3 space-y-1 text-center">
        <p className="text-sm font-semibold">Drag and drop files here</p>

        <p className="text-fd-muted-foreground max-w-64 text-xs">
          You can upload 4 files. Each up to 2MB. Accepted JPEG, PNG, GIF.
        </p>
      </div>
    </div>
  );
}
