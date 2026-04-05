# Helpers Reference — `@better-upload/server` and `@better-upload/client`

## Server Helpers — `@better-upload/server/helpers`

All helpers accept an S3 client as the first argument (created via `@better-upload/server/clients`).

### Pre-signed URLs

```ts
import { presignGetObject } from '@better-upload/server/helpers';

// Generate a signed URL to let clients download an object
const url = await presignGetObject(s3, {
  bucket: 'my-bucket',
  key: 'images/photo.jpg',
  expiresIn: 3600, // seconds (1 hour)
});
```

### Reading Objects

```ts
import { getObject, getObjectStream, headObject } from '@better-upload/server/helpers';

// Get object as Blob
const blob = await getObject(s3, { bucket: 'my-bucket', key: 'file.pdf' });

// Get object as ReadableStream (for proxying large files)
const stream = await getObjectStream(s3, { bucket: 'my-bucket', key: 'file.pdf' });

// Get metadata only (no content download)
const meta = await headObject(s3, { bucket: 'my-bucket', key: 'file.pdf' });
// meta.contentType, meta.contentLength, meta.lastModified, etc.
```

### Listing Objects

```ts
import { listObjectsV2 } from '@better-upload/server/helpers';

const { contents } = await listObjectsV2(s3, {
  bucket: 'my-bucket',
  prefix: 'users/123/',  // optional
  maxKeys: 100,          // optional
});
```

### Writing Objects

```ts
import { putObject } from '@better-upload/server/helpers';

await putObject(s3, {
  bucket: 'my-bucket',
  key: 'exports/report.csv',
  body: csvString,
  contentType: 'text/csv',
});
```

> Do not use `putObject` for client-side uploads or large files — use the router for that.

### Deleting Objects

```ts
import { deleteObject, deleteObjects } from '@better-upload/server/helpers';

// Single delete
await deleteObject(s3, { bucket: 'my-bucket', key: 'old-file.png' });

// Batch delete
const { deleted, errors } = await deleteObjects(s3, {
  bucket: 'my-bucket',
  objects: [{ key: 'file1.png' }, { key: 'file2.png' }, { key: 'file3.png' }],
});
```

### Moving and Copying Objects

```ts
import { moveObject, copyObject } from '@better-upload/server/helpers';

// Move (copy + delete original — can be slow for large files)
await moveObject(s3, {
  source: { bucket: 'my-bucket', key: 'temp/upload.jpg' },
  destination: { bucket: 'my-bucket', key: 'permanent/image.jpg' },
});

// Copy
await copyObject(s3, {
  source: { bucket: 'source-bucket', key: 'original.jpg' },
  destination: { bucket: 'dest-bucket', key: 'copy/image.jpg' },
});
```

### Object Tagging

```ts
import { getObjectTagging, putObjectTagging, deleteObjectTagging } from '@better-upload/server/helpers';

const { tags, tagsObject } = await getObjectTagging(s3, { bucket: 'my-bucket', key: 'file.jpg' });

await putObjectTagging(s3, {
  bucket: 'my-bucket',
  key: 'file.jpg',
  tagging: { env: 'production', owner: 'user-123' },
});

await deleteObjectTagging(s3, { bucket: 'my-bucket', key: 'file.jpg' });
```

### Multipart Upload Helpers (low-level)

For manually managing multipart uploads outside the router:

```ts
import {
  createMultipartUpload,
  uploadPart,
  completeMultipartUpload,
  abortMultipartUpload,
} from '@better-upload/server/helpers';

const { uploadId } = await createMultipartUpload(s3, {
  bucket: 'my-bucket',
  key: 'large-video.mp4',
  contentType: 'video/mp4',
});

const { eTag } = await uploadPart(s3, {
  bucket: 'my-bucket',
  key: 'large-video.mp4',
  uploadId,
  partNumber: 1,
  body: chunk, // Blob | Buffer | ArrayBuffer
});

await completeMultipartUpload(s3, {
  bucket: 'my-bucket',
  key: 'large-video.mp4',
  uploadId,
  parts: [{ partNumber: 1, eTag }],
});

// abort if something goes wrong
await abortMultipartUpload(s3, { bucket: 'my-bucket', key: 'large-video.mp4', uploadId });
```

---

## Client Helpers — `@better-upload/client/helpers`

### `formatBytes`

Format a raw byte count into a human-readable string.

```ts
import { formatBytes } from '@better-upload/client/helpers';

formatBytes(1000);                                      // "1 kB"
formatBytes(1000, { decimalPlaces: 2 });               // "1.00 kB"
formatBytes(1024, { si: false });                       // "1 KiB"
formatBytes(1024, { decimalPlaces: 2, si: false });    // "1.00 KiB"
```

Useful for displaying `maxFileSize` limits or current file sizes in the UI.
