import type { Client } from '@/types/clients';
import { throwS3Error } from '@/utils/s3';

/**
 * Delete an object from an S3 bucket.
 */
export async function deleteObject(
  client: Client,
  params: {
    bucket: string;

    /**
     * The key of the object to delete.
     */
    key: string;

    /**
     * The version ID of the object to delete (if versioning is enabled).
     */
    versionId?: string;
  }
) {
  const url = new URL(`${client.buildBucketUrl(params.bucket)}/${params.key}`);

  if (params.versionId) {
    url.searchParams.set('versionId', params.versionId);
  }

  await throwS3Error(
    client.s3.fetch(url.toString(), {
      method: 'DELETE',
      aws: { signQuery: true, allHeaders: true },
    })
  );
}
