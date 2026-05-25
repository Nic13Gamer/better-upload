import { defineHelper } from '@/utils/define-helper';
import { encodeObjectKey } from '@/utils/s3';

const helper = defineHelper<{
  bucket: string;
  key: string;
  uploadId: string;
}>({
  method: 'DELETE',
  url: (params) => ({
    url: `/${encodeObjectKey(params.key)}`,
    searchParams: {
      uploadId: params.uploadId,
    },
  }),
});

/**
 * Generate a pre-signed URL for aborting a multipart upload in an S3 bucket.
 */
export const presignAbortMultipartUpload = helper.presign;

/**
 * Abort a multipart upload in an S3 bucket.
 */
export const abortMultipartUpload = helper.execute;
