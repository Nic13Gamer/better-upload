---
name: better-upload
description: Use when working with better-upload, adding file uploads to a React or Next.js app using pre-signed S3 URLs, configuring upload routes or callbacks (onBeforeUpload, onAfterSignedUrl, RejectUpload), setting up S3 clients (AWS S3, Cloudflare R2, MinIO, Backblaze, DigitalOcean Spaces, Tigris, Wasabi), using useUploadFiles or useUploadFile hooks, implementing multipart uploads, managing upload progress or abort, using uploadFile/uploadFiles imperatively, integrating with TanStack Query or React Hook Form, working with S3 helpers (deleteObject, presignGetObject, moveObject), or using UploadDropzone/UploadButton components.
---

# Better Upload

Better Upload enables direct file uploads from the browser to any S3-compatible storage using pre-signed URLs. The server generates temporary signed URLs; the client uploads directly to S3 without proxying through your server.

## Architecture

```
Browser → (1) POST /api/upload → Your Server (@better-upload/server)
                                       ↓ generates pre-signed URL
Browser → (2) PUT signed URL → S3 Bucket (AWS, R2, MinIO, etc.)
```

## Packages

| Package | Role |
|---|---|
| `@better-upload/server` | Router, routes, S3 clients, object helpers |
| `@better-upload/client` | React hooks (`useUploadFiles`, `useUploadFile`), imperative upload functions |

## Installation

```bash
npm i @better-upload/server @better-upload/client
```

## Quick Start

### Server — Next.js App Router

```ts title="app/api/upload/route.ts"
import { route, type Router } from '@better-upload/server';
import { toRouteHandler } from '@better-upload/server/adapters/next';
import { cloudflare } from '@better-upload/server/clients';

const router: Router = {
  client: cloudflare(), // reads env vars automatically
  bucketName: process.env.AWS_BUCKET_NAME!,
  routes: {
    images: route({
      multipleFiles: true,
      fileTypes: ['image/*'],
      maxFileSize: 1024 * 1024 * 5, // 5MB
      maxFiles: 4,
    }),
  },
};

export const { POST } = toRouteHandler(router);
```

### Client — React hook

```tsx title="components/uploader.tsx"
'use client'; // only in Next.js

import { useUploadFiles } from '@better-upload/client';

export function Uploader() {
  const { upload, isPending, uploadedFiles } = useUploadFiles({
    route: 'images', // must match the route name in the server router
  });

  return (
    <input
      type="file"
      multiple
      disabled={isPending}
      onChange={(e) => {
        if (e.target.files) upload(e.target.files);
      }}
    />
  );
}
```

The default API endpoint is `/api/upload`. Override with `api: '/your/path'` if needed.

---

## Reference Files

Read only the file(s) relevant to the current task.

### [`reference/server.md`](reference/server.md)
Router type, `route()` options (single and multiple files), `onBeforeUpload` / `onAfterSignedUrl` callbacks, `RejectUpload`, multipart uploads, adapters (Next.js, Node.js), all S3 clients with their env vars.

### [`reference/client.md`](reference/client.md)
`useUploadFiles` and `useUploadFile` hooks — all options, return values, and events (`onBeforeUpload`, `onUploadBegin`, `onUploadProgress`, `onUploadComplete`, `onUploadFail`, `onError`, `onUploadSettle`). Imperative functions (`uploadFile`, `uploadFiles`). Pre-built shadcn components.

### [`reference/helpers.md`](reference/helpers.md)
Server-side S3 helpers from `@better-upload/server/helpers`: `presignGetObject`, `getObject`, `headObject`, `listObjectsV2`, `putObject`, `deleteObject`, `deleteObjects`, `moveObject`, `copyObject`, object tagging, and low-level multipart helpers. Client-side: `formatBytes`.

---

## Examples

Focused, copy-paste examples for common patterns.

| Example | File |
|---|---|
| Full multi-route server setup | [`examples/server-router.md`](examples/server-router.md) |
| Auth + access control with `RejectUpload` | [`examples/authentication.md`](examples/authentication.md) |
| Single file upload (avatar) | [`examples/single-file-upload.md`](examples/single-file-upload.md) |
| Client metadata + Zod validation | [`examples/client-metadata.md`](examples/client-metadata.md) |
| TanStack Query integration | [`examples/tanstack-query.md`](examples/tanstack-query.md) |
| Pre-built Dropzone component | [`examples/dropzone-component.md`](examples/dropzone-component.md) |
| Cancel / abort an upload | [`examples/abort-upload.md`](examples/abort-upload.md) |
| Delete files from S3 | [`examples/delete-files.md`](examples/delete-files.md) |
| CORS configuration | [`examples/cors-configuration.md`](examples/cors-configuration.md) |
