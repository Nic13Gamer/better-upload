# Example: Delete Files After Upload

Use the `deleteObject` helper in a server route to delete uploaded files.

```ts title="app/api/files/[key]/route.ts"
import { deleteObject } from '@better-upload/server/helpers';
import { s3 } from '@/lib/s3'; // your configured S3 client
import { requireAuth } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { key: string } }
) {
  const user = await requireAuth(request);

  await deleteObject(s3, {
    bucket: process.env.AWS_BUCKET_NAME!,
    key: `users/${user.id}/${params.key}`,
  });

  return Response.json({ success: true });
}
```

## Batch delete

```ts
import { deleteObjects } from '@better-upload/server/helpers';

const { deleted, errors } = await deleteObjects(s3, {
  bucket: process.env.AWS_BUCKET_NAME!,
  objects: [{ key: 'file1.png' }, { key: 'file2.png' }],
});
```

> See [`reference/helpers.md`](../reference/helpers.md) for all available S3 object helpers.
