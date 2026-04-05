# Server Reference — `@better-upload/server`

## Router

The `Router` is the central configuration object. Pass it to an adapter to expose the upload endpoint.

```ts
import { type Router } from '@better-upload/server';

export const router: Router = {
  client: s3,           // S3-compatible client (see S3 Clients below)
  bucketName: 'my-bucket',
  routes: {
    // named routes — name must match what the client sends
    images: route({ multipleFiles: true, fileTypes: ['image/*'] }),
    avatar: route({ fileTypes: ['image/*'], maxFileSize: 1024 * 1024 }),
  },
};
```

## Route Options

Use the `route()` function to define each route.

### Multiple files (`multipleFiles: true`)

```ts
import { route } from '@better-upload/server';

route({
  multipleFiles: true,
  fileTypes: ['image/*', 'application/pdf'], // optional, all types allowed if omitted
  maxFileSize: 1024 * 1024 * 5,            // 5MB, default
  maxFiles: 3,                              // default
  signedUrlExpiresIn: 120,                  // seconds, default
  clientMetadataSchema: zodSchema,          // optional Standard Schema (Zod, etc.)
});
```

### Single file (no `multipleFiles`)

```ts
route({
  fileTypes: ['image/*'],
  maxFileSize: 1024 * 1024 * 2, // 2MB
  signedUrlExpiresIn: 120,
  clientMetadataSchema: zodSchema,
});
```

## Callbacks

### `onBeforeUpload`

Runs before pre-signed URLs are generated. Use for auth, rate-limiting, setting custom keys.

```ts
// Single file version
route({
  onBeforeUpload: async ({ req, file, clientMetadata }) => {
    const user = await auth();
    if (!user) throw new RejectUpload('Not logged in!');

    return {
      objectInfo: {             // object key and S3 options
        key: `users/${user.id}/${file.name}`,
        // acl, metadata, storageClass, cacheControl, tagging all optional
      },
      metadata: { userId: user.id }, // passed to onAfterSignedUrl
      bucketName: 'another-bucket',  // override bucket if needed
    };
  },
});

// Multiple files version — uses generateObjectInfo per file
route({
  multipleFiles: true,
  onBeforeUpload: async ({ req, files, clientMetadata }) => {
    const user = await auth();
    if (!user) throw new RejectUpload('Not authenticated');

    const uploadId = crypto.randomUUID();
    return {
      generateObjectInfo: ({ file }) => ({
        key: `uploads/${uploadId}/${file.name}`,
        // skip: true  ← to skip a specific file
      }),
      metadata: { userId: user.id },
    };
  },
});
```

**Important**: throw `RejectUpload` (imported from `@better-upload/server`) to reject and send the error to the client.

### `onAfterSignedUrl`

Runs after pre-signed URLs are generated. Use for logging, saving records.

```ts
// Single file
route({
  onAfterSignedUrl: async ({ req, file, metadata, clientMetadata }) => {
    // file.objectInfo is now populated
    await db.files.create({ key: file.objectInfo.key, userId: metadata.userId });

    return {
      metadata: { fileKey: file.objectInfo.key }, // sent back to client
    };
  },
});

// Multiple files
route({
  multipleFiles: true,
  onAfterSignedUrl: async ({ req, files, metadata, clientMetadata }) => {
    // files[n].objectInfo is populated
    return { metadata: { count: files.length } };
  },
});
```

## Multipart Uploads

For files larger than 5GB, or when you want faster uploads via parallel parts:

```ts
route({
  multipart: true,
  partSize: 1024 * 1024 * 50,           // 50MB per part (default)
  partSignedUrlExpiresIn: 1500,          // 25 min (default)
  completeSignedUrlExpiresIn: 1800,      // 30 min (default)
  // combine with multipleFiles: true if needed
});
```

No client-side changes needed — multipart is handled automatically.

> Empty files (0 bytes) will fail with multipart. 
> Even for files under 5GB, multipart can speed up uploads.

## Adapters

### Next.js App Router

```ts title="app/api/upload/route.ts"
import { toRouteHandler } from '@better-upload/server/adapters/next';
export const { POST } = toRouteHandler(router);
```

### Node.js (raw Request/Response)

```ts
import { toNodeHandler } from '@better-upload/server/adapters/node';
// toNodeHandler(router) returns a Node.js HTTP request handler
```

## S3 Clients

All clients are exported from `@better-upload/server/clients`.
All parameters are optional — if omitted, clients read from environment variables.

| Client | Function | Key env vars |
|---|---|---|
| AWS S3 | `aws()` | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` |
| Cloudflare R2 | `cloudflare()` | `CLOUDFLARE_ACCOUNT_ID`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |
| Backblaze B2 | `backblaze()` | `BACKBLAZE_KEY_ID`, `BACKBLAZE_APPLICATION_KEY`, `BACKBLAZE_REGION` |
| DigitalOcean Spaces | `digitalocean()` | `DIGITALOCEAN_ACCESS_KEY_ID`, `DIGITALOCEAN_SECRET_ACCESS_KEY`, `DIGITALOCEAN_REGION` |
| Linode / Akamai | `linode()` | `LINODE_ACCESS_KEY_ID`, `LINODE_SECRET_ACCESS_KEY`, `LINODE_REGION` |
| MinIO | `minio()` | `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY_ID`, `MINIO_SECRET_ACCESS_KEY` |
| Tigris | `tigris()` | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |
| Wasabi | `wasabi()` | `WASABI_ACCESS_KEY_ID`, `WASABI_SECRET_ACCESS_KEY`, `WASABI_REGION` |
| Custom | `custom({ host, accessKeyId, secretAccessKey, region })` | — |

```ts
import { cloudflare, aws, minio } from '@better-upload/server/clients';

// Use env vars
const s3 = cloudflare();

// Or explicit params
const s3 = aws({ accessKeyId: '...', secretAccessKey: '...', region: 'us-east-1' });
```

## Exports from `@better-upload/server`

- `route(options)` — create a route definition
- `type Router` — type for the router object
- `RejectUpload` — error class to throw inside callbacks to reject uploads
