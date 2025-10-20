# better-upload

## 2.0.3

### Patch Changes

- [`526a022`](https://github.com/Nic13Gamer/better-upload/commit/526a022543c7314ac519df3187d8161c590f998a) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Make peer dependencies optional

## 2.0.2

### Patch Changes

- [`e3f825a`](https://github.com/Nic13Gamer/better-upload/commit/e3f825a31508408443f5864f482a7faf5df33e97) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Add `cacheControl` option to object info in `onBeforeUpload` return.

## 2.0.1

### Patch Changes

- [#60](https://github.com/Nic13Gamer/better-upload/pull/60) [`d312623`](https://github.com/Nic13Gamer/better-upload/commit/d312623ee06f55878f48f8d2c98e2713b5986e87) Thanks [@olhapi](https://github.com/olhapi)! - Add `credentials` option to hooks

## 2.0.0

### Major Changes

- [#55](https://github.com/Nic13Gamer/better-upload/pull/55) [`79fda2e`](https://github.com/Nic13Gamer/better-upload/commit/79fda2ebcf3f80a809d14a4feef5448df54a1629) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Version 2.0.0

  This update changes how properties of the S3 object are set when uploading files, making it more flexible. It also includes some changes for better usability.

  ## Breaking Changes

  ### `onBeforeUpload` return

  You now return `objectInfo` (`generateObjectInfo` for multiple files) instead of `objectKey` (`generateObjectKey` for multiple files) and `objectMetadata` (`generateObjectMetadata` for multiple files).

  Example:

  ```ts
  // single files
  route({
    onBeforeUpload: ({ file }) => {
      return {
        objectInfo: {
          key: `uploads/${file.name}`,
        },
      };
    },
  });

  // multiple files
  route({
    multipleFiles: true,
    onBeforeUpload: () => {
      return {
        generateObjectInfo: ({ file }) => ({
          key: `uploads/${file.name}`,
        }),
      };
    },
  });
  ```

  With this change, you can now also set other properties of the S3 object, like `acl` and `storageClass`. Please suggest new properties by opening an issue.

  ### `UploadFileError` to reject upload has been renamed

  To reject an upload in `onBeforeUpload`, you now throw `RejectUpload` instead of throwing `UploadFileError`.

  ### Cloudflare R2 helper renamed

  The `r2` helper client for Cloudflare R2 has been renamed to `cloudflare`. This is to make it more consistent with other helpers.

### Minor Changes

- [#55](https://github.com/Nic13Gamer/better-upload/pull/55) [`79fda2e`](https://github.com/Nic13Gamer/better-upload/commit/79fda2ebcf3f80a809d14a4feef5448df54a1629) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Rename `r2` client helper to `cloudflare`

## 1.1.1

### Patch Changes

- [`cb0677d`](https://github.com/Nic13Gamer/better-upload/commit/cb0677d07ddd872fd71d2f62e8a3e9b07d1ccda8) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Make internal types available under `/server/internal` and `/client/internal`

## 1.1.0

### Minor Changes

- [`39bb3c8`](https://github.com/Nic13Gamer/better-upload/commit/39bb3c8374b4f7eff5718e031c5862b7dd180ffa) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Better DX for upload aborts

- [#45](https://github.com/Nic13Gamer/better-upload/pull/45) [`860c627`](https://github.com/Nic13Gamer/better-upload/commit/860c627aeaa63db54e3c678365d5f593d4d027aa) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Add upload retries

### Patch Changes

- [`16d6ec9`](https://github.com/Nic13Gamer/better-upload/commit/16d6ec9a75e63e51c9b107c8ce84955f3892e220) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Fix multipart upload not getting set as failed

- [`1961c8c`](https://github.com/Nic13Gamer/better-upload/commit/1961c8c259b3747b58be68b5846e2f2f857ff366) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Add Tigris client helper

## 1.0.2

### Patch Changes

- [`3ea3f8b`](https://github.com/Nic13Gamer/better-upload/commit/3ea3f8baeb24aea597be4612471a8795425cc9fe) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Fix hooks success and `isSettled` true on initial state.

## 1.0.1

### Patch Changes

- [`e54050d`](https://github.com/Nic13Gamer/better-upload/commit/e54050dab788c94ea77d4b5943484495be7e99ea) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Fix empty files failing to request signed URL

## 1.0.0

### Major Changes

- [`9b1bec9`](https://github.com/Nic13Gamer/better-upload/commit/9b1bec9ec0714cba4328bae20315b65eeb7f9750) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - 1.0.0 release

## 0.3.3

### Patch Changes

- [`1ad927b`](https://github.com/Nic13Gamer/better-upload/commit/1ad927b2ea2af3d3b525d37a21886b29451f7051) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Use Zod v4-mini

- [`2f329e7`](https://github.com/Nic13Gamer/better-upload/commit/2f329e791e4e071cb275aedf0938c0563a26cd2c) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Only set `uploadedFiles` after XHR has completed.

## 0.3.2

### Patch Changes

- [`b30bc9e`](https://github.com/Nic13Gamer/better-upload/commit/b30bc9ea2c8f7d17c3e3b0ec15672dacb5cbeb4c) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Client metadata schema validation

## 0.3.1

### Patch Changes

- [#27](https://github.com/Nic13Gamer/better-upload/pull/27) [`8a5068d`](https://github.com/Nic13Gamer/better-upload/commit/8a5068d09724d62a2bffc2d408062418bf8f6d1e) Thanks [@stephanebachelier](https://github.com/stephanebachelier)! - Add DigitalOcean Spaces client helper

## 0.3.0

### Minor Changes

- [#25](https://github.com/Nic13Gamer/better-upload/pull/25) [`369a009`](https://github.com/Nic13Gamer/better-upload/commit/369a009e59f8d96c0b09fdebb438361cb2af0206) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Refactor entire client API

  This update completely refactors the client-side code, providing a stronger foundation for future improvements.

  ## Breaking changes

  ### Reworked hooks

  The `useUploadFile` and `useUploadFiles` hooks have been rewritten to allow for greater control, improve DX, provide more information, and improve error handling.

  #### `useUploadFiles` changes

  The hook now returns different values:
  - `isSuccess` has been removed. Use `allSucceeded`, `hasFailedFiles`, and `isSettled` instead.
  - `isError` now only returns `true` if a critical error occurs and no files were uploaded. The `error` value follows this same logic.

  Changes to options:
  - `sequential` has been removed. Use `uploadBatchSize` instead.
  - `onUploadSettled` has been renamed to `onUploadSettle`.
  - `onUploadError` has been removed. Use `onUploadFail`, which is called only once after the entire upload if some files failed, and `onError` for critical errors where no files were uploaded.

  #### `useUploadFile` changes

  Changes to options:
  - `onUploadSettled` has been renamed to `onUploadSettle`.
  - `onUploadError` has been removed. Use `onError` instead.

  ### Changes to pre-built components

  Pre-built components no longer internally use the upload hooks. Instead, you should use the hooks directly and pass the `control` object returned by the hook to the component's `control` prop. See an example [here](https://better-upload.js.org/components/upload-dropzone).

  ### `UploadedFile` type removed

  The `UploadedFile` type has been removed. Use `FileUploadInfo<T>` instead, where `T` can be `completed`, `failed`, `pending`, or `uploading`. You can also use `UploadStatus` as `T` for all possible statuses.

  ### `readableBytes` renamed to `formatBytes`

  The client helper `readableBytes` has been renamed to `formatBytes`. A simple find-and-replace should work.

## 0.2.7

### Patch Changes

- [`c6cda1d`](https://github.com/Nic13Gamer/better-upload/commit/c6cda1d99afd3a20c3d933eafb9ec3b631c593b6) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Return uploaded files in hook upload promise

- [`175bd1d`](https://github.com/Nic13Gamer/better-upload/commit/175bd1ddb37d04629a815a3fa00bc98e15b33e88) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Allow promises on some hook events

## 0.2.6

### Patch Changes

- [`1220e88`](https://github.com/Nic13Gamer/better-upload/commit/1220e88b8e2a7c5c16d6eae940a6d16918591202) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Files arrays in hook should never be null

## 0.2.5

### Patch Changes

- [`7dfe959`](https://github.com/Nic13Gamer/better-upload/commit/7dfe95991638ca05881c693c7f249f54e42ea90e) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - S3 object metadata

## 0.2.4

### Patch Changes

- [`f373d9b`](https://github.com/Nic13Gamer/better-upload/commit/f373d9b13e5059c4590f6f653f18d20e4c3376ee) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Add Backblaze B2 and Wasabi helper clients.

## 0.2.3

### Patch Changes

- [`38f633d`](https://github.com/Nic13Gamer/better-upload/commit/38f633df1f3d8153297fb3516e42e64ca288869b) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Better client error handling

## 0.2.2

### Patch Changes

- [`d0dec32`](https://github.com/Nic13Gamer/better-upload/commit/d0dec32eff7fe72e0b466cebafb49095ce09e487) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Return which file failed to upload

## 0.2.1

### Patch Changes

- [`cb33d1f`](https://github.com/Nic13Gamer/better-upload/commit/cb33d1f58791c2c2b246579f384352b0cf9f4c71) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Readable bytes client helper

## 0.2.0

### Minor Changes

- [`b29dd5a`](https://github.com/Nic13Gamer/better-upload/commit/b29dd5a15c7ccc9931d28f4d23d21b74ccc747ad) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Choose other bucket name in route before upload callback

### Patch Changes

- [`a49916e`](https://github.com/Nic13Gamer/better-upload/commit/a49916e0831168e7a09f572f54ab7ec4cabd2f56) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Set progress to 0 for all files to be uploaded

## 0.1.4

### Patch Changes

- [`9fcc8ff`](https://github.com/Nic13Gamer/better-upload/commit/9fcc8ffa3c8b14d0737e17b121e22a176c511835) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Fix multipart upload part order

## 0.1.3

### Patch Changes

- [`3374121`](https://github.com/Nic13Gamer/better-upload/commit/337412184596f2231f7a6d28637e3c66f6bfadd9) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Bug fix

## 0.1.2

### Patch Changes

- [`1808865`](https://github.com/Nic13Gamer/better-upload/commit/180886544c5a7f1725ce2fcd5e9f18045ac8b3db) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Minio helper client

## 0.1.1

### Patch Changes

- [`8981d7e`](https://github.com/Nic13Gamer/better-upload/commit/8981d7e9fb960a5409f3f788fb469ff02f537b88) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Add jurisdiction option to Cloudflare R2 client helper

## 0.1.0

### Minor Changes

- [`1e48e2a`](https://github.com/Nic13Gamer/better-upload/commit/1e48e2a6a69e112dae12dfd264d00d9266e31418) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - Initial release

## 0.0.1

Note that `better-upload` is still in beta and not ready for production use.

### Patch Changes

- [`10c6205`](https://github.com/Nic13Gamer/better-upload/commit/10c6205b419c346cd48f76c62dc5779aa2ec3e6b) Thanks [@Nic13Gamer](https://github.com/Nic13Gamer)! - New features & bug fixes
