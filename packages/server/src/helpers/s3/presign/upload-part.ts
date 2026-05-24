import type { Client } from '@/types/router/internal';
import { baseSignedUrl, cleanUndefined, encodeObjectKey } from '@/utils/s3';

/**
 * Generate a pre-signed URL to upload a part in a multipart upload to an S3 bucket.
 */
export async function presignUploadPart(
  client: Client,
  params: {
    bucket: string;
    key: string;
    uploadId: string;
    partNumber: number;
    contentLength?: number;

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
  url.searchParams.set('partNumber', params.partNumber.toString());
  url.searchParams.set('uploadId', params.uploadId);

  const headers = cleanUndefined({
    'content-length': params.contentLength?.toString(),
  });

  const { url: signed } = await client.s3.sign(url.toString(), {
    method: 'PUT',
    headers,
    aws: { signQuery: true, allHeaders: true },
  });

  return {
    url: signed,
    headers,
  };
}
