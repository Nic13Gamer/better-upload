import type { Client } from '@/types/clients';
import { throwS3Error } from '@/utils/s3';
import { parseXml } from '@/utils/xml';

/**
 * Get the tags of an object from an S3 bucket.
 */
export async function getObjectTagging(
  client: Client,
  params: {
    bucket: string;
    key: string;

    /**
     * The version ID of the object to get tags for (if versioning is enabled).
     */
    versionId?: string;
  }
) {
  if (!params.key.trim()) {
    throw new Error('The object key cannot be empty.');
  }

  const url = new URL(
    `${client.buildBucketUrl(params.bucket)}/${params.key}?tagging`
  );

  if (params.versionId) {
    url.searchParams.set('versionId', params.versionId);
  }

  const res = await throwS3Error(
    client.s3.fetch(url.toString(), {
      method: 'GET',
      aws: { signQuery: true, allHeaders: true },
    })
  );

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
}
