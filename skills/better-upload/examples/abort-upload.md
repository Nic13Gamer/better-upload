# Example: Abort / Cancel Upload

Use an `AbortController` to cancel an in-progress upload. Pass the signal via the hook options or directly to the `upload()` call.

```tsx
'use client';

import { useRef } from 'react';
import { useUploadFiles } from '@better-upload/client';

export function CancellableUploader() {
  const controllerRef = useRef<AbortController | null>(null);

  const { upload, isPending, isAborted } = useUploadFiles({ route: 'images' });

  function startUpload(files: FileList) {
    const controller = new AbortController();
    controllerRef.current = controller;
    upload(files, { signal: controller.signal });
  }

  function cancelUpload() {
    controllerRef.current?.abort();
  }

  return (
    <>
      <input
        type="file"
        multiple
        disabled={isPending}
        onChange={(e) => e.target.files && startUpload(e.target.files)}
      />
      {isPending && (
        <button onClick={cancelUpload}>Cancel upload</button>
      )}
      {isAborted && <p>Upload was cancelled.</p>}
    </>
  );
}
```

> See [`reference/client.md`](../reference/client.md) for the `signal`, `isAborted`, and other hook state.
