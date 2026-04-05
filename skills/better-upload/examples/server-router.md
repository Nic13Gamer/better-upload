# Example: Full Server Router

A complete Next.js upload handler with multiple routes (single file, multiple files, and multipart).

```ts title="app/api/upload/route.ts"
import { route, type Router } from '@better-upload/server';
import { toRouteHandler } from '@better-upload/server/adapters/next';
import { cloudflare } from '@better-upload/server/clients';

const router: Router = {
  client: cloudflare(), // reads CLOUDFLARE_ACCOUNT_ID, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
  bucketName: process.env.AWS_BUCKET_NAME!,
  routes: {
    // Single file image upload
    image: route({
      fileTypes: ['image/*'],
      maxFileSize: 1024 * 1024 * 2, // 2MB
    }),

    // Multiple image upload with unique keys per file
    images: route({
      fileTypes: ['image/*'],
      multipleFiles: true,
      maxFiles: 4,
      onBeforeUpload() {
        const uploadId = crypto.randomUUID();
        return {
          generateObjectInfo({ file }) {
            return { key: `uploads/${uploadId}/${file.name}` };
          },
        };
      },
    }),

    // Multipart upload for large files
    multipart: route({
      multipart: true,
      multipleFiles: true,
      maxFiles: 5,
      partSize: 1024 * 1024 * 5,    // 5MB per part
      maxFileSize: 1024 * 1024 * 80, // 80MB max per file
    }),
  },
};

export const { POST } = toRouteHandler(router);
```

> See [`reference/server.md`](../reference/server.md) for all router and route options.
