import type { Client } from '@/types/clients';
import type { Tagging } from '@/types/s3';
import { encodeObjectKey, encodeTagging, throwS3Error } from '@/utils/s3';

/**
 * Copy an object, within or between, S3 buckets.
 */
export async function copyObject(
  client: Client,
  params: {
    source: {
      bucket: string;
      key: string;
    };
    destination: {
      bucket: string;
      key: string;
    };
    taggingDirective?: 'COPY' | 'REPLACE';
    /**
     * Use only if `taggingDirective` is set to `REPLACE`.
     */
    tagging?: Tagging;
  }
) {
  const url = new URL(
    `${client.buildBucketUrl(params.destination.bucket)}/${encodeObjectKey(params.destination.key)}`
  );

  await throwS3Error(
    client.s3.fetch(url.toString(), {
      method: 'PUT',
      headers: {
        'x-amz-copy-source': `${params.source.bucket}/${encodeObjectKey(params.source.key)}`,
        ...(params.taggingDirective
          ? { 'x-amz-tagging-directive': params.taggingDirective }
          : {}),
        ...(params.tagging
          ? { 'x-amz-tagging': encodeTagging(params.tagging) }
          : {}),
      },
      aws: { signQuery: true, allHeaders: true },
    }),
    { checkOk: true }
  );
}
