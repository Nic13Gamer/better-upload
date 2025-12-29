import type { Client } from '@/types/clients';
import { throwS3Error } from '@/utils/s3';

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
  if (!params.key.trim()) {
    throw new Error('The object key cannot be empty.');
  }

  const url = new URL(`${client.buildBucketUrl(params.bucket)}/${params.key}`);
  url.searchParams.set('uploadId', params.uploadId);

  await throwS3Error(
    client.s3.fetch(url.toString(), {
      method: 'DELETE',
      aws: { signQuery: true, allHeaders: true },
    })
  );
}
