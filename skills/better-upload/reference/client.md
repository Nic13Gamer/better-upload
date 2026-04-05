# Client Reference — `@better-upload/client`

## `useUploadFiles` — Multiple Files

```tsx
import { useUploadFiles } from '@better-upload/client';

const {
  upload,          // (files: FileList | File[], options?) => void
  uploadAsync,     // same but returns a Promise
  reset,           // () => void — clear state
  control,         // pass to pre-built components like <UploadDropzone>

  // state
  uploadedFiles,   // File[] — files that succeeded
  failedFiles,     // File[] — files that failed
  progresses,      // Map<string, number> — progress per file (0–1)
  averageProgress, // number — average progress of all files (0–1)
  isPending,       // boolean
  isAborted,       // boolean
  isSettled,       // boolean — upload finished (success or error)
  isError,         // boolean
  allSucceeded,    // boolean — true if every file uploaded successfully
  hasFailedFiles,  // boolean
  error,           // Error | null
  metadata,        // object | null — server metadata returned by onAfterSignedUrl
} = useUploadFiles({
  route: 'images',  // REQUIRED — must match a route name in your server router
  api: '/api/upload',        // optional, default: '/api/upload'
  uploadBatchSize: 3,        // optional, upload N files in parallel (default: all)
  multipartBatchSize: 5,     // optional, upload N parts in parallel (default: all)
  signal: abortController.signal, // optional
  headers: { Authorization: `Bearer ${token}` }, // optional
  credentials: 'include',    // optional: 'include' | 'same-origin' | 'omit'
  retry: 2,                  // optional, retry count on network failure (default: 0)
  retryDelay: 1000,          // optional, ms between retries (default: 0)
});
```

### Events for `useUploadFiles`

```tsx
useUploadFiles({
  route: 'images',

  // Called before requesting signed URLs. Return modified files to transform them.
  onBeforeUpload: ({ files }) => {
    return files.map((file) => new File([file], 'renamed-' + file.name, { type: file.type }));
  },

  // Called after server responds with signed URLs, before upload to S3 starts.
  onUploadBegin: ({ files, metadata }) => {
    console.log('Starting upload of', files.length, 'files');
  },

  // Called whenever any file's progress changes.
  onUploadProgress: ({ file }) => {
    console.log(`${file.name}: ${file.progress * 100}%`);
  },

  // Called after at least one file succeeds (even if others failed).
  onUploadComplete: ({ files, failedFiles, metadata }) => {
    console.log(`${files.length} files uploaded`);
  },

  // Called if at least one file fails (even if others succeeded).
  onUploadFail: ({ succeededFiles, failedFiles, metadata }) => {
    console.log('Some files failed:', failedFiles);
  },

  // Called when a critical error occurs before upload to S3 (e.g., server unreachable, invalid input).
  onError: (error) => {
    console.error('Upload error:', error.message);
  },

  // Called when the upload settles (success or error).
  onUploadSettle: ({ files, failedFiles, metadata }) => {
    console.log('Upload finished');
  },
});
```

### Sending metadata from client (`useUploadFiles`)

```tsx
const { upload } = useUploadFiles({ route: 'images' });

upload(files, {
  metadata: { folder: 'profile-pics', userId: '123' },
});
```

Validate this on the server with `clientMetadataSchema` in the route definition.

---

## `useUploadFile` — Single File

```tsx
import { useUploadFile } from '@better-upload/client';

const {
  upload,        // (file: File, options?) => void
  uploadAsync,
  reset,
  control,

  // state
  uploadedFile,  // File | null
  progress,      // number (0–1)
  isPending,
  isAborted,
  isSettled,
  isError,
  isSuccess,
  error,
  metadata,      // object | null
} = useUploadFile({
  route: 'avatar',
  api: '/api/upload',
  // same options as useUploadFiles except uploadBatchSize
});
```

### Events for `useUploadFile`

```tsx
useUploadFile({
  route: 'avatar',

  onBeforeUpload: ({ file }) => {
    return new File([file], 'avatar.jpg', { type: file.type });
  },

  onUploadBegin: ({ file, metadata }) => {},
  onUploadProgress: ({ file }) => { console.log(file.progress); },
  onUploadComplete: ({ file, metadata }) => {},
  onError: (error) => {},
  onUploadSettle: ({ file, metadata }) => {},
});
```

### Sending metadata (`useUploadFile`)

```tsx
upload(file, { metadata: { category: 'profile' } });
```

---

## Imperative Functions (without hooks)

Use these with TanStack Query's `useMutation` or any async context.

### `uploadFiles`

```tsx
import { uploadFiles, type FileUploadInfo, type UploadStatus } from '@better-upload/client';

const result = await uploadFiles({
  files: Array.from(fileList),
  route: 'images',
  api: '/api/upload',       // optional
  headers: {},              // optional
  credentials: 'include',   // optional
  signal: controller.signal, // optional
  retry: 0,                 // optional
  retryDelay: 0,            // optional

  onFileStateChange: ({ file }) => {
    // file is FileUploadInfo<UploadStatus>
    // manually track progress with this callback
    console.log(file);
  },
});

// result: { files: File[], failedFiles: File[], metadata: object | null }
```

### `uploadFile`

```tsx
import { uploadFile } from '@better-upload/client';

const result = await uploadFile({
  file,
  route: 'avatar',
  onFileStateChange: ({ file }) => { console.log(file.progress); },
});

// result: { file: File, metadata: object | null }
```

---

## Pre-built Components

Better Upload provides optional shadcn-compatible UI components. Install via shadcn CLI:

```bash
npx shadcn@latest add @better-upload/upload-dropzone  # multiple files dropzone
npx shadcn@latest add @better-upload/upload-button    # single file button
npx shadcn@latest add @better-upload/upload-progress  # progress display
npx shadcn@latest add @better-upload/paste-upload-area # paste-to-upload wrapper
```

Use the `control` property from the hook to connect:

```tsx
import { useUploadFiles } from '@better-upload/client';
import { UploadDropzone } from '@/components/ui/upload-dropzone';

export function Uploader() {
  const { control } = useUploadFiles({ route: 'images' });

  return (
    <UploadDropzone
      control={control}
      accept="image/*"
      description={{ maxFiles: 4, maxFileSize: '5MB', fileTypes: 'JPEG, PNG' }}
    />
  );
}
```
