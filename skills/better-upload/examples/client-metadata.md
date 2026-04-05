# Example: Client Metadata with Zod Validation

Send contextual data from the client (e.g., a folder name) and validate it on the server using any Standard Schema-compatible library like Zod.

**Server** — define the schema in the route:

```ts
import { z } from 'zod';
import { route } from '@better-upload/server';

const uploadRoute = route({
  multipleFiles: true,
  clientMetadataSchema: z.object({
    folder: z.string(),
    isPublic: z.boolean().optional(),
  }),
  onBeforeUpload: async ({ clientMetadata }) => {
    // clientMetadata is typed and validated at this point
    return {
      generateObjectInfo: ({ file }) => ({
        key: `${clientMetadata.folder}/${file.name}`,
      }),
    };
  },
});
```

**Client** — pass metadata when calling `upload`:

```tsx
import { useUploadFiles } from '@better-upload/client';

export function Uploader() {
  const { upload } = useUploadFiles({ route: 'images' });

  return (
    <input
      type="file"
      multiple
      onChange={(e) => {
        if (e.target.files) {
          upload(e.target.files, {
            metadata: { folder: 'profile-pics', isPublic: false },
          });
        }
      }}
    />
  );
}
```

> See [`reference/client.md`](../reference/client.md) for the full `useUploadFiles` options.  
> See [`reference/server.md`](../reference/server.md) for the `clientMetadataSchema` option.
