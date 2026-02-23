import type { Client } from '@/types/clients';
import type { GetObjectResult, GetObjectStreamResult } from '@/types/s3';
import { parseHeadObjectHeaders, throwS3Error } from '@/utils/s3';

/**
 * Get an object from an S3 bucket.
 *
 * This gets the entire object data, as a blob. To generate a pre-signed URL for getting an object on the client, use `presignGetObject`.
 */
export async function getObject(
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
  }
): Promise<GetObjectResult> {
  if (!params.key.trim()) {
    throw new Error('The object key cannot be empty.');
  }

  const url = new URL(`${client.buildBucketUrl(params.bucket)}/${params.key}`);

  if (params.versionId) {
    url.searchParams.set('versionId', params.versionId);
  }

  const res = await throwS3Error(
    client.s3.fetch(url.toString(), {
      method: 'GET',
      ...(params.range && { headers: { 'Range': params.range } }),
      aws: { signQuery: true, allHeaders: true },
    })
  );

  return {
    blob: await res.blob(),
    ...parseHeadObjectHeaders(res.headers),
  };
}

/**
 * Get an object from an S3 bucket.
 *
 * This gets the entire object data, as a stream. To generate a pre-signed URL for getting an object on the client, use `presignGetObject`.
 */
export async function getObjectStream(
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
  }
): Promise<GetObjectStreamResult> {
  if (!params.key.trim()) {
    throw new Error('The object key cannot be empty.');
  }

  const url = new URL(`${client.buildBucketUrl(params.bucket)}/${params.key}`);

  if (params.versionId) {
    url.searchParams.set('versionId', params.versionId);
  }
  if (params.range) {
    url.searchParams.set('range', params.range);
  }

  const res = await throwS3Error(
    client.s3.fetch(url.toString(), {
      method: 'GET',
      aws: { signQuery: true, allHeaders: true },
    })
  );

  if (!res.body) {
    throw new Error('S3 object response body is null.');
  }

  return {
    stream: res.body,
    ...parseHeadObjectHeaders(res.headers),
  };
}
