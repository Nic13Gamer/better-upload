import { defineHelper } from '@/utils/define-helper';
import { encodeObjectKey } from '@/utils/s3';

const helper = defineHelper<{
  bucket: string;
  key: string;

  /**
   * The version ID of the object to delete tags for (if versioning is enabled).
   */
  versionId?: string;
}>({
  method: 'DELETE',
  url: (params) => ({
    url: `/${encodeObjectKey(params.key)}?tagging`,
    searchParams: {
      versionId: params.versionId,
    },
  }),
});

/**
 * Generate a pre-signed URL for deleting object tags from an S3 bucket.
 */
export const presignDeleteObjectTagging = helper.presign;

/**
 * Delete the tags of an object from an S3 bucket.
 */
export const deleteObjectTagging = helper.execute;
