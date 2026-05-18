import type { Client } from '@/types/clients';
import type { GetObjectBlobResult, GetObjectStreamResult } from '@/types/s3';
import { parseHeadObjectHeaders, throwS3Error } from '@/utils/s3';
import { presignGetObject } from './presign/get-object';

type GetObjectParams = {
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
};

const fetchObject = async (client: Client, params: GetObjectParams) =>
  await throwS3Error(
    fetch(await presignGetObject(client, params), { method: 'GET' })
  );

/**
 * Get an object from an S3 bucket.
 *
 * This gets the entire object data, as a blob. To generate a pre-signed URL for getting an object on the client, use `presignGetObject`.
 */
export async function getObjectBlob(
  client: Client,
  params: GetObjectParams
): Promise<GetObjectBlobResult> {
  const res = await fetchObject(client, params);

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
  params: GetObjectParams
): Promise<GetObjectStreamResult> {
  const res = await fetchObject(client, params);

  if (!res.body) {
    throw new Error('S3 object response body is null.');
  }

  return {
    stream: res.body,
    ...parseHeadObjectHeaders(res.headers),
  };
}
