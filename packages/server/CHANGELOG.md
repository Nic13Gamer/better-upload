# @better-upload/server

## 3.0.12

### Patch Changes

- [#108](https://github.com/Nic13Gamer/better-upload/pull/108) [`0643eec`](https://github.com/Nic13Gamer/better-upload/commit/0643eec10b6ccb1f4310021ca02d0e1d0fa7ee35) Thanks [@wonu](https://github.com/wonu)! - Fix `tagging` in object info for single files

## 3.0.11

### Patch Changes

- [`7baf75f`](https://github.com/Nic13Gamer/better-upload/commit/7baf75fbee53f688f81d47dedd094e1eb967fb55) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Set object tagging in `onBeforeUpload`

- [`7baf75f`](https://github.com/Nic13Gamer/better-upload/commit/7baf75fbee53f688f81d47dedd094e1eb967fb55) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Add S3 helpers for object tagging operations

- [`d2676b0`](https://github.com/Nic13Gamer/better-upload/commit/d2676b09612085b13038d8a2dc3b35e057cf49ce) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Fix `deleteObjects` helper

## 3.0.10

### Patch Changes

- [`d658b86`](https://github.com/Nic13Gamer/better-upload/commit/d658b8673d57bd12683ecbde90a0e5830c578fe5) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Fix `deleteObjects` S3 helper

## 3.0.9

### Patch Changes

- [#100](https://github.com/Nic13Gamer/better-upload/pull/100) [`b629022`](https://github.com/Nic13Gamer/better-upload/commit/b629022765ef98568cda8d0337cfd96dedd2adf9) Thanks [@weepaho3](https://github.com/weepaho3)! - Add `deleteObjects` S3 helper

## 3.0.8

### Patch Changes

- [`85324c4`](https://github.com/Nic13Gamer/better-upload/commit/85324c4cf0e0a73cd4f9a6b1da356afacc9435d3) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Add helpers for S3 multipart operations

## 3.0.7

### Patch Changes

- [`4f1bb6f`](https://github.com/Nic13Gamer/better-upload/commit/4f1bb6fbfbf6a86a686e8d0b156c65282264a677) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Skip upload for specific files

- [`4f1bb6f`](https://github.com/Nic13Gamer/better-upload/commit/4f1bb6fbfbf6a86a686e8d0b156c65282264a677) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Add `getObjectStream` S3 helper

## 3.0.6

### Patch Changes

- [#90](https://github.com/Nic13Gamer/better-upload/pull/90) [`c7d951c`](https://github.com/Nic13Gamer/better-upload/commit/c7d951c43686168212b9e48d25d522a2ce7d2f13) Thanks [@gschlabitz](https://github.com/gschlabitz)! - Add Linode client

## 3.0.5

### Patch Changes

- [`fbcf0e3`](https://github.com/Nic13Gamer/better-upload/commit/fbcf0e31d6b3cb687746ad6fde950807910a0cf9) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Use headers instead of query params for PUT

## 3.0.4

### Patch Changes

- [`f9ad2b6`](https://github.com/Nic13Gamer/better-upload/commit/f9ad2b65d1eeec613ddfbe8b1e64a8a9e1eac981) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Add `range` option to get object helpers

- [`246da28`](https://github.com/Nic13Gamer/better-upload/commit/246da28af24f52a1e854e774dca4424e43dd802e) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Fix `putObject` helper content length

## 3.0.3

### Patch Changes

- [`4fa8ac2`](https://github.com/Nic13Gamer/better-upload/commit/4fa8ac203baaa31659b96ecdf2f73a98774dcd78) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Add `putObject` helper

## 3.0.2

### Patch Changes

- [`da4718b`](https://github.com/Nic13Gamer/better-upload/commit/da4718bf67e56822385cd8fd561e9a5efd80c10b) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Add `sessionToken` to custom & AWS clients

## 3.0.1

### Patch Changes

- [`4952ac4`](https://github.com/Nic13Gamer/better-upload/commit/4952ac43aa88bacc24a520f2fa51b0a056a66a7a) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Fix MinIO client host

## 3.0.0

### Major Changes

- [#72](https://github.com/Nic13Gamer/better-upload/pull/72) [`f83e990`](https://github.com/Nic13Gamer/better-upload/commit/f83e9905205de1e202f15fc3afc9883bcfad2360) Thanks [@'user_123',](https://github.com/'user_123',)! - Version 3.0.0

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
    client: aws(), // or cloudflare(), backblaze(), tigris(), ...,
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
              metadata: {},
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

### Minor Changes

- [#72](https://github.com/Nic13Gamer/better-upload/pull/72) [`f83e990`](https://github.com/Nic13Gamer/better-upload/commit/f83e9905205de1e202f15fc3afc9883bcfad2360) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Node (express & fastify) request handlers

- [#72](https://github.com/Nic13Gamer/better-upload/pull/72) [`f83e990`](https://github.com/Nic13Gamer/better-upload/commit/f83e9905205de1e202f15fc3afc9883bcfad2360) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Helpers for more S3 commands: presign get object, get object, head object, copy object, delete object
