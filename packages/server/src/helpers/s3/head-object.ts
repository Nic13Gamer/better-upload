import type { Client } from '@/types/clients';
import { parseHeadObjectHeaders, throwS3Error } from '@/utils/s3';

/**
 * Head (retrieve metadata of) an object from an S3 bucket.
 *
 * Does not retrieve the object data itself.
 */
export async function headObject(
  client: Client,
  params: {
    bucket: string;
    key: string;

    /**
     * The version ID of the object to head (if versioning is enabled).
     */
    versionId?: string;
  }
) {
  const url = new URL(`${client.buildBucketUrl(params.bucket)}/${params.key}`);

  if (params.versionId) {
    url.searchParams.set('versionId', params.versionId);
  }

  const res = await throwS3Error(
    client.s3.fetch(url.toString(), {
      method: 'HEAD',
      aws: { signQuery: true, allHeaders: true },
    })
  );

  return parseHeadObjectHeaders(res.headers);
}
