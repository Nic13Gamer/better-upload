import type { Client } from '@/types/clients';
import type { ObjectAcl, ObjectMetadata, StorageClass } from '@/types/s3';
import { throwS3Error } from '@/utils/s3';

/**
 * Put an object into an S3 bucket. Do not use for files larger than 5GB.
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
  const contentLength = getContentLength(params.body);

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

function getContentLength(body: BodyInit | null): number | null {
  if (body == null) return 0;

  if (typeof body === 'string') {
    return new TextEncoder().encode(body).length;
  }

  if (body instanceof Blob) {
    return body.size;
  }

  if (body instanceof ArrayBuffer) {
    return body.byteLength;
  }

  if (ArrayBuffer.isView(body)) {
    return body.byteLength;
  }

  if (body instanceof URLSearchParams) {
    return new TextEncoder().encode(body.toString()).length;
  }

  if (body instanceof FormData) {
    return null;
  }

  if (body instanceof ReadableStream) {
    return null;
  }

  return null;
}
