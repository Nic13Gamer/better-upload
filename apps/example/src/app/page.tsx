import { FileUploader } from "@/components/file-uploader";

export default function Home() {
  return (
    <main className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-2xl font-semibold">Next.js File Upload Example</h1>

        <FileUploader />
      </div>
    </main>
  );
}
