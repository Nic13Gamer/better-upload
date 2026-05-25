import { defineHelper } from '@/utils/define-helper';
import { encodeObjectKey } from '@/utils/s3';

const helper = defineHelper<{
  bucket: string;
  key: string;

  /**
   * The version ID of the object to delete (if versioning is enabled).
   */
  versionId?: string;
}>({
  method: 'DELETE',
  url: (params) => ({
    url: `/${encodeObjectKey(params.key)}`,
    searchParams: {
      versionId: params.versionId,
    },
  }),
});

/**
 * Generate a pre-signed URL for deleting an object from an S3 bucket.
 */
export const presignDeleteObject = helper.presign;

/**
 * Delete an object from an S3 bucket.
 */
export const deleteObject = helper.execute;
