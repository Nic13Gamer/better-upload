import type { Client } from '@/types/clients';
import type { GetObjectResult } from '@/types/s3';
import { parseHeadObjectHeaders, throwS3Error } from '@/utils/s3';

/**
 * Get an object from an S3 bucket.
 *
 * This gets the entire object data. To generate a pre-signed URL for getting an object on the client, use `presignGetObject`.
 */
export async function getObject(
  client: Client,
  params: {
    bucket: string;
    key: string;

    /**
     * The version ID of the object to delete (if versioning is enabled).
     */
    versionId?: string;
  }
): Promise<GetObjectResult> {
  const url = new URL(`${client.buildBucketUrl(params.bucket)}/${params.key}`);

  if (params.versionId) {
    url.searchParams.set('versionId', params.versionId);
  }

  const res = await throwS3Error(
    client.s3.fetch(url.toString(), {
      method: 'GET',
      aws: { signQuery: true, allHeaders: true },
    })
  );

  return {
    blob: await res.blob(),
    ...parseHeadObjectHeaders(res.headers),
  };
}
