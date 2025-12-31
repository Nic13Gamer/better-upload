import type { Client } from '@/types/clients';
import type { Tagging } from '@/types/s3';
import { getBodyContentLength, throwS3Error } from '@/utils/s3';

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
  if (!params.key.trim()) {
    throw new Error('The object key cannot be empty.');
  }

  const url = new URL(
    `${client.buildBucketUrl(params.bucket)}/${params.key}?tagging`
  );

  if (params.versionId) {
    url.searchParams.set('versionId', params.versionId);
  }

  const body = `<Tagging>
  <TagSet>
    ${Object.entries(params.tagging)
      .map(
        ([key, value]) => `<Tag>
      <Key>${key}</Key>
      <Value>${value}</Value>
    </Tag>`
      )
      .join('')}
  </TagSet>
</Tagging>`;

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
