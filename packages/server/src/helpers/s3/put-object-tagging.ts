import type { Client } from '@/types/clients';
import type { Tagging } from '@/types/s3';
import {
  encodeObjectKey,
  getBodyContentLength,
  throwS3Error,
} from '@/utils/s3';
import { xml } from '@/utils/xml';

/**
 * Put tags on an object in an S3 bucket.
 */
export async function putObjectTagging(
  client: Client,
  params: {
    bucket: string;
    key: string;
    tagging: Tagging;

    /**
     * The version ID of the object to put tags for (if versioning is enabled).
     */
    versionId?: string;
  }
) {
  const url = new URL(
    `${client.buildBucketUrl(params.bucket)}/${encodeObjectKey(params.key)}?tagging`
  );

  if (params.versionId) {
    url.searchParams.set('versionId', params.versionId);
  }

  const body = xml`<Tagging>
  <TagSet>
    ${Object.entries(params.tagging).map(
      ([key, value]) => xml`<Tag>
      <Key>${key}</Key>
      <Value>${value}</Value>
    </Tag>`
    )}
  </TagSet>
</Tagging>`.toString();

  await throwS3Error(
    client.s3.fetch(url.toString(), {
      method: 'PUT',
      headers: {
        'content-type': 'application/xml',
        'content-length': getBodyContentLength(body)!.toString(),
      },
      body,
      aws: { signQuery: true, allHeaders: true },
    })
  );
}
