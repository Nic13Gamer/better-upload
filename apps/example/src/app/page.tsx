import { FileUploader } from '@/components/file-uploader';
import { FilesUploader } from '@/components/files-uploader';

export default function Home() {
  return (
    <main className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-2xl font-semibold">Next.js File Upload Example</h1>

        <div className="w-full space-y-1">
          <p className="text-sm font-medium">Single file (template)</p>

          <FileUploader />
        </div>

        <div className="w-full space-y-1">
          <p className="text-sm font-medium">Multiple files</p>

          <FilesUploader />
        </div>
      </div>
    </main>
  );
}
