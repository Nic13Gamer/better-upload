# Example: Single File Upload (Profile Avatar)

Upload a single file with a fixed key — useful for profile pictures that overwrite each other.

**Server:**

```ts
import { route, RejectUpload } from '@better-upload/server';
import { requireAuth } from '@/lib/auth';

const avatarRoute = route({
  fileTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize: 1024 * 1024, // 1MB

  onBeforeUpload: async ({ req, file }) => {
    const user = await requireAuth(req);
    return {
      objectInfo: {
        key: `avatars/${user.id}`, // same key every time — overwrites the existing avatar
      },
    };
  },
});
```

**Client:**

```tsx
'use client';

import { useUploadFile } from '@better-upload/client';
import { toast } from 'sonner';

export function AvatarUploader() {
  const { upload, isPending, isSuccess, uploadedFile } = useUploadFile({
    route: 'avatar',
    onUploadComplete: ({ file, metadata }) => {
      toast.success('Avatar updated!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <input
      type="file"
      accept="image/*"
      disabled={isPending}
      onChange={(e) => {
        if (e.target.files?.[0]) upload(e.target.files[0]);
      }}
    />
  );
}
```

> See [`reference/client.md`](../reference/client.md) for the full `useUploadFile` API.
