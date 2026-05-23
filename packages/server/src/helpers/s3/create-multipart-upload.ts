import type { Client } from '@/types/clients';
import type {
  ObjectAcl,
  ObjectMetadata,
  StorageClass,
  Tagging,
} from '@/types/s3';
import {
  cleanUndefined,
  encodeObjectKey,
  encodeTagging,
  throwS3Error,
} from '@/utils/s3';
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
    tagging?: Tagging;
  }
) {
  const url = new URL(
    `${client.buildBucketUrl(params.bucket)}/${encodeObjectKey(params.key)}?uploads`
  );

  const res = await throwS3Error(
    client.s3.fetch(url.toString(), {
      method: 'POST',
      headers: cleanUndefined({
        'content-type': params.contentType,
        'x-amz-acl': params.acl,
        'x-amz-storage-class': params.storageClass,
        'cache-control': params.cacheControl,
        'x-amz-tagging': params.tagging
          ? encodeTagging(params.tagging)
          : undefined,
        ...Object.fromEntries(
          Object.entries(params.metadata || {}).map(([key, value]) => [
            `x-amz-meta-${key.toLowerCase()}`,
            value,
          ])
        ),
      }),
      aws: { signQuery: true, allHeaders: true },
    })
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
