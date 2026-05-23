import type { Client } from '@/types/clients';
import { baseSignedUrl, encodeObjectKey } from '@/utils/s3';

/**
 * Generate a pre-signed URL for completing a multipart upload in an S3 bucket.
 */
export async function presignCompleteMultipartUpload(
  client: Client,
  params: {
    bucket: string;
    key: string;
    uploadId: string;

    /**
     * Expiration time in seconds for the pre-signed URL.
     *
     * @default 900 // 15 minutes
     */
    expiresIn?: number;
  }
) {
  const url = baseSignedUrl(
    `${client.buildBucketUrl(params.bucket)}/${encodeObjectKey(params.key)}`,
    { expiresIn: params.expiresIn ?? 900 }
  );
  url.searchParams.set('uploadId', params.uploadId);

  const headers = {
    'content-type': 'application/xml',
  };

  const { url: signed } = await client.s3.sign(url.toString(), {
    method: 'POST',
    headers,
    aws: { signQuery: true, allHeaders: true },
  });

  return {
    url: signed,
    headers,
  };
}
