import type { Client } from '@/types/clients';
import type { Tagging } from '@/types/s3';
import { encodeTagging, throwS3Error } from '@/utils/s3';

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
  await throwS3Error(
    client.s3.fetch(
      `${client.buildBucketUrl(params.destination.bucket)}/${params.destination.key}`,
      {
        method: 'PUT',
        headers: {
          'x-amz-copy-source': `${params.source.bucket}/${params.source.key}`,
          ...(params.taggingDirective
            ? { 'x-amz-tagging-directive': params.taggingDirective }
            : {}),
          ...(params.tagging
            ? { 'x-amz-tagging': encodeTagging(params.tagging) }
            : {}),
        },
        aws: { signQuery: true, allHeaders: true },
      }
    )
  );
}
