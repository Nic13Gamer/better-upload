import type { Client } from '@/types/clients';
import { encodeObjectKey, throwS3Error } from '@/utils/s3';

/**
 * Abort a multipart upload in an S3 bucket.
 */
export async function abortMultipartUpload(
  client: Client,
  params: {
    bucket: string;
    key: string;
    uploadId: string;
  }
) {
  const url = new URL(
    `${client.buildBucketUrl(params.bucket)}/${encodeObjectKey(params.key)}`
  );
  url.searchParams.set('uploadId', params.uploadId);

  await throwS3Error(
    client.s3.fetch(url.toString(), {
      method: 'DELETE',
      aws: { signQuery: true, allHeaders: true },
    })
  );
}
