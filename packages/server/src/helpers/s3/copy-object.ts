import type { Client } from '@/types/clients';
import { throwS3Error } from '@/utils/s3';

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
  }
) {
  await throwS3Error(
    client.s3.fetch(
      `${client.buildBucketUrl(params.destination.bucket)}/${params.destination.key}`,
      {
        method: 'PUT',
        headers: {
          'x-amz-copy-source': `${params.source.bucket}/${params.source.key}`,
        },
        aws: { signQuery: true, allHeaders: true },
      }
    )
  );
}
