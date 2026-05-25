import { defineHelper } from '@/utils/define-helper';
import { encodeObjectKey } from '@/utils/s3';
import { xml } from '@/utils/xml';
import type { Tagging } from '@repo/shared/types/s3';

const helper = defineHelper<{
  bucket: string;
  key: string;
  tagging: Tagging;

  /**
   * The version ID of the object to put tags for (if versioning is enabled).
   */
  versionId?: string;
}>({
  method: 'PUT',
  url: (params) => ({
    url: `/${encodeObjectKey(params.key)}?tagging`,
    searchParams: {
      versionId: params.versionId,
    },
  }),
  execute: {
    buildBody: (params) => xml`<Tagging>
  <TagSet>
    ${Object.entries(params.tagging).map(
      ([key, value]) => xml`<Tag>
      <Key>${key}</Key>
      <Value>${value}</Value>
    </Tag>`
    )}
  </TagSet>
</Tagging>`,
  },
});

/**
 * Generate a pre-signed URL for putting object tags in an S3 bucket.
 */
export const presignPutObjectTagging = helper.presign;

/**
 * Put tags on an object in an S3 bucket.
 */
export const putObjectTagging = helper.execute;
