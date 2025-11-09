---
'@better-upload/client': major
---

Version 3.0.0

## Breaking Changes

### New package

The `better-upload` package has been split into separate packages. Everything exported from `better-upload/client` is now available at `@better-upload/client`.

```bash
npm remove better-upload
npm install @better-upload/client
```

### Object info

`objectKey` has been removed from `FileUploadInfo` and replaced with `objectInfo`, which contains more information about the S3 object, such as `key`, `metadata`, and `cacheControl`.

`objectInfo` is now present on all instances where you would previously find `objectKey`. Here's an example of how to update your code:

Before:

```tsx
useUploadFile({
  route: 'demo',
  onUploadComplete: ({ file }) => {
    console.log(file.objectKey);
    // object metadata and cacheControl are missing
  },
});
```

After:

```tsx
useUploadFile({
  route: 'demo',
  onUploadComplete: ({ file }) => {
    console.log(file.objectInfo.key);
    // there is also .metadata and .cacheControl
  },
});
```
