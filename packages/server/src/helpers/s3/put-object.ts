import { defineHelper } from '@/utils/define-helper';
import { encodeObjectKey, encodeTagging } from '@/utils/s3';
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
    contentLength?: number;
    metadata?: ObjectMetadata;
    acl?: ObjectAcl;
    storageClass?: StorageClass;
    cacheControl?: string;
    tagging?: Tagging;
  },
  { body: BodyInit }
>({
  method: 'PUT',
  url: (params) => ({
    url: `/${encodeObjectKey(params.key)}`,
  }),
  headers: (params) => ({
    'content-type': params.contentType,
    'content-length': params.contentLength?.toString(),
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
  execute: {
    buildBody: (params) => params.body,
  },
});

/**
 * Generate a pre-signed URL for putting an object into an S3 bucket. Do not use for files larger than 5GB.
 *
 * Do not use this for client-side uploads, use the standard Better Upload router insted.
 */
export const presignPutObject = helper.presign;

/**
 * Put an object into an S3 bucket. Do not use for files larger than 5GB (use multipart uploads instead).
 *
 * Do not use this for client-side uploads, use the standard Better Upload router insted.
 */
export const putObject = helper.execute;
