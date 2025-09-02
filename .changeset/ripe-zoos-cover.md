---
'better-upload': major
---

Version 2.0.0

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
