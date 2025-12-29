import type { Client } from '@/types/clients';
import type { ObjectAcl, ObjectMetadata, StorageClass } from '@/types/s3';
import { throwS3Error } from '@/utils/s3';
import { parseXml } from '@/utils/xml';

/**
 * Create a multipart upload in an S3 bucket.
 */
export async function createMultipartUpload(
  client: Client,
  params: {
    bucket: string;
    key: string;
    contentType: string;
    metadata?: ObjectMetadata;
    acl?: ObjectAcl;
    storageClass?: StorageClass;
    cacheControl?: string;
  }
) {
  if (!params.key.trim()) {
    throw new Error('The object key cannot be empty.');
  }

  const res = await throwS3Error(
    client.s3.fetch(
      `${client.buildBucketUrl(params.bucket)}/${params.key}?uploads`,
      {
        method: 'POST',
        headers: {
          'content-type': params.contentType,
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
        aws: { signQuery: true, allHeaders: true },
      }
    )
  );

  const parsed = parseXml<{
    InitiateMultipartUploadResult: {
      Bucket: string;
      Key: string;
      UploadId: string;
    };
  }>(await res.text());

  return {
    bucket: parsed.InitiateMultipartUploadResult.Bucket,
    key: parsed.InitiateMultipartUploadResult.Key,
    uploadId: parsed.InitiateMultipartUploadResult.UploadId,
  };
}
