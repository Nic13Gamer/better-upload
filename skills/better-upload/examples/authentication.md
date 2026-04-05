# Example: Authentication and Access Control

Use `onBeforeUpload` to protect routes. Throw `RejectUpload` to deny the upload and send the message back to the client.

```ts
import { route, RejectUpload } from '@better-upload/server';
import { auth } from '@/lib/auth';

const imagesRoute = route({
  multipleFiles: true,
  fileTypes: ['image/*'],
  maxFileSize: 1024 * 1024 * 5, // 5MB

  onBeforeUpload: async ({ req, files, clientMetadata }) => {
    const user = await auth();
    if (!user) throw new RejectUpload('Not logged in!');

    return {
      generateObjectInfo: ({ file }) => ({
        key: `users/${user.id}/${crypto.randomUUID()}/${file.name}`,
      }),
      metadata: { userId: user.id }, // passed through to onAfterSignedUrl
    };
  },

  onAfterSignedUrl: async ({ req, files, metadata }) => {
    // Save file records to DB after signed URLs are generated
    await db.files.createMany({
      data: files.map((f) => ({
        key: f.objectInfo.key,
        userId: metadata.userId,
      })),
    });
    return { metadata: { saved: true } };
  },
});
```

> See [`reference/server.md`](../reference/server.md) for the full callbacks API.
