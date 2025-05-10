---
'better-upload': minor
---

Refactor entire client API

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
