import type { Client } from '@/types/clients';
import {
  encodeObjectKey,
  getBodyContentLength,
  throwS3Error,
} from '@/utils/s3';

/**
 * Upload a part in a multipart upload to an S3 bucket.
 */
export async function uploadPart(
  client: Client,
  params: {
    bucket: string;
    key: string;
    uploadId: string;
    partNumber: number;
    body: BodyInit;
    contentLength?: number;
  }
) {
  const url = new URL(
    `${client.buildBucketUrl(params.bucket)}/${encodeObjectKey(params.key)}`
  );
  url.searchParams.set('partNumber', params.partNumber.toString());
  url.searchParams.set('uploadId', params.uploadId);

  const contentLength =
    params.contentLength ?? getBodyContentLength(params.body);

  const res = await throwS3Error(
    client.s3.fetch(url.toString(), {
      method: 'PUT',
      headers: {
        ...(contentLength !== null
          ? { 'content-length': contentLength.toString() }
          : {}),
      },
      body: params.body,
      aws: { signQuery: true, allHeaders: true },
    })
  );

  return {
    eTag: res.headers.get('etag') || '',
  };
}
