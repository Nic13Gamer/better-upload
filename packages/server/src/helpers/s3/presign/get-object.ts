import type { Client } from '@/types/clients';
import { baseSignedUrl } from '@/utils/s3';

/**
 * Generate a pre-signed URL to get (download) an object from an S3 bucket.
 */
export async function presignGetObject(
  client: Client,
  params: {
    bucket: string;
    key: string;

    /**
     * The version ID of the object to get (if versioning is enabled).
     */
    versionId?: string;

    /**
     * The range of bytes to retrieve from the object.
     *
     * @example
     *
     * ```ts
     * range: 'bytes=0-1023' // Get the first 1024 bytes
     * ```
     */
    range?: string;

    /**
     * Expiration time in seconds for the pre-signed URL.
     *
     * @default 900 // 15 minutes
     */
    expiresIn?: number;
  }
) {
  if (!params.key.trim()) {
    throw new Error('The object key cannot be empty.');
  }

  const url = baseSignedUrl(
    `${client.buildBucketUrl(params.bucket)}/${params.key}`,
    {
      expiresIn: params.expiresIn ?? 900,
    }
  );

  if (params.versionId) {
    url.searchParams.set('versionId', params.versionId);
  }
  if (params.range) {
    url.searchParams.set('range', params.range);
  }

  return (
    await client.s3.sign(url.toString(), {
      method: 'GET',
      aws: { signQuery: true, allHeaders: true },
    })
  ).url;
}
