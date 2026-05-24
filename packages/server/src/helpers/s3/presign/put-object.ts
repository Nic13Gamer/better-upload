import type { Client } from '@/types/router/internal';
import {
  baseSignedUrl,
  cleanUndefined,
  encodeObjectKey,
  encodeTagging,
} from '@/utils/s3';
import type {
  ObjectAcl,
  ObjectMetadata,
  StorageClass,
  Tagging,
} from '@repo/shared/types/s3';

/**
 * Generate a pre-signed URL for putting an object into an S3 bucket. Do not use for files larger than 5GB.
 *
 * Do not use this for client-side uploads, use the standard Better Upload router insted.
 */
export async function presignPutObject(
  client: Client,
  params: {
    bucket: string;
    key: string;
    contentType: string;
    contentLength?: number;
    metadata?: ObjectMetadata;
    acl?: ObjectAcl;
    storageClass?: StorageClass;
    cacheControl?: string;
    tagging?: Tagging;

    /**
     * Expiration time in seconds for the pre-signed URL.
     *
     * @default 900 // 15 minutes
     */
    expiresIn?: number;
  }
) {
  const url = baseSignedUrl(
    `${client.buildBucketUrl(params.bucket)}/${encodeObjectKey(params.key)}`,
    { expiresIn: params.expiresIn ?? 900 }
  );
  url.searchParams.set('X-Amz-Content-Sha256', 'UNSIGNED-PAYLOAD');

  const headers = cleanUndefined({
    'content-type': params.contentType,
    'content-length': params.contentLength?.toString(),
    'x-amz-acl': params.acl,
    'x-amz-storage-class': params.storageClass,
    'cache-control': params.cacheControl,
    'x-amz-tagging': params.tagging ? encodeTagging(params.tagging) : undefined,
    ...Object.fromEntries(
      Object.entries(params.metadata || {}).map(([key, value]) => [
        `x-amz-meta-${key.toLowerCase()}`,
        value,
      ])
    ),
  });

  const { url: signed } = await client.s3.sign(url.toString(), {
    method: 'PUT',
    headers,
    aws: { signQuery: true, allHeaders: true },
  });

  return {
    url: signed,
    headers,
  };
}
