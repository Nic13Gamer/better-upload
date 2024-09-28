import { Upload } from 'lucide-react';

export function UploadDropzoneDemo() {
  return (
    <div className="relative size-min rounded-lg border-2 border-dashed transition-colors">
      <div className="bg-muted/5 hover:dark:bg-muted/20 hover:bg-muted/25 flex w-full min-w-64 cursor-pointer flex-col items-center justify-center px-2 py-6 transition-colors">
        <div className="bg-background rounded-full border border-dashed p-2.5">
          <Upload className="size-6" />
        </div>

        <div className="mt-2.5 space-y-1 text-center">
          <p className="m-0 text-sm font-semibold">Drag and drop files here</p>

          <p className="text-muted-foreground max-w-64 text-xs">
            You can upload 4 files. Each up to 2MB. Accepted JPEG, PNG, GIF.
          </p>
        </div>
      </div>
    </div>
  );
}
