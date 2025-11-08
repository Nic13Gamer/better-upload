---
'@better-upload/server': major
---

Version 3.0.0

This update removes the AWS SDK and uses `aws4fetch`, improving performance and reducing bundle size. There are also some changes to provide a better developer experience.

## Breaking Changes

### New package

The `better-upload` package has been split into separate packages. The server package is now available at `@better-upload/server`.

```bash
npm remove better-upload @aws-sdk/client-s3
npm install @better-upload/server
```

### S3 clients

Client helpers from `better-upload/server/helpers` have been removed. Clients are now exported from `@better-upload/server/clients`.

Here's how to update your router code:

```ts
import { Router } from '@better-upload/server';
import { aws } from '@better-upload/server/clients';

const router: Router = {
  client: aws(); // or cloudflare(), backblaze(), tigris(), ...,
  bucketName: 'my-bucket',
  routes: {
    // ...
  },
};
```

As the AWS SDK was removed, you cannot use `new S3Client()` anymore. Instead, use the [pre-built clients](https://better-upload.com/docs/helpers-server#s3-clients) for popular services, or the `custom()` client for any S3-compatible service:

```ts
import { custom } from '@better-upload/server/clients';

// example for AWS S3, even though you should use aws()
const s3 = custom({
  hostname: 's3.us-east-1.amazonaws.com',
  accessKeyId: '...',
  secretAccessKey: '...',
  region: 'us-east-1',
  secure: true,
  forcePathStyle: false,
});
```

#### How to do S3 operations now

You can now use helpers provided by `@better-upload/server/helpers` to perform some common S3 operations previously done with the AWS SDK. [Learn more in the docs.](https://better-upload.com/docs/helpers-server#objects)

### Move object helper

The `moveObject` helper has been updated to be more flexible.

```ts
import { aws } from '@better-upload/server/clients';
import { moveObject } from '@better-upload/server/helpers';

await moveObject(aws(), {
  source: {
    bucket: 'source-bucket',
    key: 'example.png',
  },
  destination: {
    bucket: 'destination-bucket',
    key: 'copy.png',
  },
});
```

### Object info

Now, where previously only `objectKey` was available, the full `objectInfo` is provided, which includes the object `key`, `metadata`, `acl`, `storageClass`, and `cacheControl`.

Here's an example of where it's used:

```ts
const router: Router = {
  client: aws(),
  bucketName: 'my-bucket',
  routes: {
    demo: route({
      onBeforeUpload: ({ file }) => {
        // file.objectInfo is NOT available here

        return {
          objectInfo: {
            key: `uploads/${file.name}`,
            metadata: {
              author: 'user_123',
            },
          },
        };
      },
      
      onAfterSignedUrl: ({ file }) => {
        console.log(file.objectInfo); // full objectInfo is available here
      },
    }),
  },
};
```

### Next.js Route Handler

The `createUploadRouteHandler` function has been renamed to `toRouteHandler` and is now exported from `@better-upload/server/adapters/next`.

```ts
import { Router } from '@better-upload/server';
import { toRouteHandler } from '@better-upload/server/adapters/next';

const router: Router = {
  // ...
};

export const { POST } = toRouteHandler(router);
```
