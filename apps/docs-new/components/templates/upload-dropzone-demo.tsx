import { Upload } from 'lucide-react';

export function UploadDropzoneDemo() {
  return (
    <div className="not-prose hover:bg-accent dark:hover:bg-accent/30 dark:bg-input/10 dark:border-input flex min-w-72 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-transparent px-2 py-6 transition-colors">
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
