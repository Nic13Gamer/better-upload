# Example: TanStack Query Integration

If you prefer managing async state yourself, use the imperative `uploadFiles` / `uploadFile` functions with `useMutation`.

## Multiple files

```tsx title="components/uploader.tsx"
'use client';

import { uploadFiles } from '@better-upload/client';
import { useMutation } from '@tanstack/react-query';

export function Uploader() {
  const { mutate: upload, isPending } = useMutation({
    mutationFn: (files: File[]) =>
      uploadFiles({
        files,
        route: 'images',
        onFileStateChange: ({ file }) => {
          console.log(`${file.name}: ${Math.round(file.progress * 100)}%`);
        },
      }),
    onSuccess: ({ files, failedFiles, metadata }) => {
      console.log(`${files.length} files uploaded`);
    },
    onError: (error) => console.error(error),
  });

  return (
    <input
      type="file"
      multiple
      disabled={isPending}
      onChange={(e) => {
        if (e.target.files) upload(Array.from(e.target.files));
      }}
    />
  );
}
```

## Single file

```tsx
import { uploadFile } from '@better-upload/client';
import { useMutation } from '@tanstack/react-query';

export function AvatarUploader() {
  const { mutate: upload, isPending } = useMutation({
    mutationFn: (file: File) =>
      uploadFile({
        file,
        route: 'avatar',
        onFileStateChange: ({ file }) => console.log(file.progress),
      }),
    onSuccess: ({ file, metadata }) => console.log('Uploaded:', file),
    onError: (error) => console.error(error),
  });

  return (
    <input
      type="file"
      disabled={isPending}
      onChange={(e) => {
        if (e.target.files?.[0]) upload(e.target.files[0]);
      }}
    />
  );
}
```

> See [`reference/client.md`](../reference/client.md) for `uploadFiles` and `uploadFile` full API.
