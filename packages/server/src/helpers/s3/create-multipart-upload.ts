import { defineHelper } from '@/utils/define-helper';
import { encodeObjectKey, encodeTagging } from '@/utils/s3';
import { parseXml } from '@/utils/xml';
import type {
  ObjectAcl,
  ObjectMetadata,
  StorageClass,
  Tagging,
} from '@repo/shared/types/s3';

const helper = defineHelper<
  {
    bucket: string;
    key: string;
    contentType: string;
    metadata?: ObjectMetadata;
    acl?: ObjectAcl;
    storageClass?: StorageClass;
    cacheControl?: string;
    tagging?: Tagging;
  },
  {},
  { bucket: string; key: string; uploadId: string }
>({
  method: 'POST',
  url: (params) => ({
    url: `/${encodeObjectKey(params.key)}?uploads`,
  }),
  headers: (params) => ({
    'content-type': params.contentType,
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
  }),
  execute: {
    parseData: async (res) => {
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
    },
  },
});

/**
 * Generate a pre-signed URL for creating a multipart upload in an S3 bucket.
 */
export const presignCreateMultipartUpload = helper.presign;

/**
 * Create a multipart upload in an S3 bucket.
 */
export const createMultipartUpload = helper.execute;
