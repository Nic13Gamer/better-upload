import { defineHelper } from '@/utils/define-helper';
import { encodeObjectKey } from '@/utils/s3';
import { parseXml } from '@/utils/xml';

const helper = defineHelper<
  {
    bucket: string;
    key: string;

    /**
     * The version ID of the object to get tags for (if versioning is enabled).
     */
    versionId?: string;
  },
  {},
  {
    tags: { key: string; value: string }[];
    tagsObject: Record<string, string>;
  }
>({
  method: 'GET',
  url: (params) => ({
    url: `/${encodeObjectKey(params.key)}?tagging`,
    searchParams: {
      versionId: params.versionId,
    },
  }),
  execute: {
    parseData: async (res) => {
      const parsed = parseXml<{
        Tagging: {
          TagSet: { Tag?: { Key: string; Value: string }[] };
        };
      }>(await res.text(), {
        arrayPath: ['Tagging.TagSet.Tag'],
      });

      return {
        tags:
          parsed.Tagging.TagSet.Tag?.map((tag) => ({
            key: tag.Key,
            value: tag.Value,
          })) || [],
        tagsObject: Object.fromEntries(
          parsed.Tagging.TagSet.Tag?.map((tag) => [tag.Key, tag.Value]) || []
        ),
      };
    },
  },
});

/**
 * Generate a pre-signed URL for getting the tags of an object in an S3 bucket.
 */
export const presignGetObjectTagging = helper.presign;

/**
 * Get the tags of an object from an S3 bucket.
 */
export const getObjectTagging = helper.execute;
