import type { Client } from '@/types/clients';
import type { ObjectAcl, ObjectMetadata, StorageClass } from '@/types/s3';
import { getBodyContentLength, throwS3Error } from '@/utils/s3';

/**
 * Put an object into an S3 bucket. Do not use for files larger than 5GB (use multipart uploads instead).
 *
 * Do not use this for client-side uploads, use the standard Better Upload router insted.
 */
export async function putObject(
  client: Client,
  params: {
    bucket: string;
    key: string;
    body: BodyInit;
    contentType: string;
    metadata?: ObjectMetadata;
    acl?: ObjectAcl;
    storageClass?: StorageClass;
    cacheControl?: string;
  }
) {
  const contentLength = getBodyContentLength(params.body);

  await throwS3Error(
    client.s3.fetch(`${client.buildBucketUrl(params.bucket)}/${params.key}`, {
      method: 'PUT',
      headers: {
        'content-type': params.contentType,
        ...(contentLength !== null
          ? { 'content-length': contentLength.toString() }
          : {}),
        ...(params.acl ? { 'x-amz-acl': params.acl } : {}),
        ...(params.storageClass
          ? { 'x-amz-storage-class': params.storageClass }
          : {}),
        ...(params.cacheControl
          ? { 'cache-control': params.cacheControl }
          : {}),
        ...Object.fromEntries(
          Object.entries(params.metadata || {}).map(([key, value]) => [
            `x-amz-meta-${key.toLowerCase()}`,
            value,
          ])
        ),
      },
      body: params.body,
      aws: { signQuery: true, allHeaders: true },
    })
  );
}
