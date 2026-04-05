# Example: Pre-built Dropzone Component

Better Upload ships optional shadcn-compatible UI components. The `UploadDropzone` component wraps the `useUploadFiles` hook automatically via the `control` prop.

## Install the component

```bash
npx shadcn@latest add @better-upload/upload-dropzone
```

## Usage

```tsx title="components/image-uploader.tsx"
'use client';

import { useUploadFiles } from '@better-upload/client';
import { UploadDropzone } from '@/components/ui/upload-dropzone';

export function ImageUploader() {
  const { control, uploadedFiles, isPending } = useUploadFiles({
    route: 'images',
    onUploadComplete: ({ files }) => {
      console.log('Uploaded:', files);
    },
    onError: (error) => {
      console.error(error.message);
    },
  });

  return (
    <UploadDropzone
      control={control}
      accept="image/*"
      description={{
        maxFiles: 4,
        maxFileSize: '5MB',
        fileTypes: 'JPEG, PNG, GIF',
      }}
    />
  );
}
```

## Other available components

| Component | Install command | Use |
|---|---|---|
| `<UploadButton />` | `npx shadcn@latest add @better-upload/upload-button` | Single file button |
| `<UploadDropzone />` | `npx shadcn@latest add @better-upload/upload-dropzone` | Multiple files dropzone |
| `<UploadProgress />` | `npx shadcn@latest add @better-upload/upload-progress` | Progress display |
| `<PasteUploadArea />` | `npx shadcn@latest add @better-upload/paste-upload-area` | Paste-to-upload wrapper |

> See [`reference/client.md`](../reference/client.md) for the `control` prop and hook state.
