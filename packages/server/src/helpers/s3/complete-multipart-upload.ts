import type { Client } from '@/types/clients';
import { getBodyContentLength, throwS3Error } from '@/utils/s3';
import { parseXml } from '@/utils/xml';

/**
 * Complete a multipart upload in an S3 bucket.
 */
export async function completeMultipartUpload(
  client: Client,
  params: {
    bucket: string;
    key: string;
    uploadId: string;
    parts: { partNumber: number; eTag: string }[];
  }
) {
  if (!params.key.trim()) {
    throw new Error('The object key cannot be empty.');
  }

  const url = new URL(`${client.buildBucketUrl(params.bucket)}/${params.key}`);
  url.searchParams.set('uploadId', params.uploadId);

  const body = `
<CompleteMultipartUpload>
  ${params.parts
    .sort((a, b) => a.partNumber - b.partNumber)
    .map(
      (part) => `<Part>
    <PartNumber>${part.partNumber}</PartNumber>
    <ETag>${part.eTag}</ETag>
  </Part>`
    )
    .join('')}
</CompleteMultipartUpload>
`;

  const res = await throwS3Error(
    client.s3.fetch(url.toString(), {
      method: 'POST',
      headers: {
        'content-type': 'application/xml',
        'content-length': getBodyContentLength(body)!.toString(),
      },
      body,
      aws: { signQuery: true, allHeaders: true },
    })
  );

  const parsed = parseXml<{
    CompleteMultipartUploadResult: {
      Location: string;
      Bucket: string;
      Key: string;
      ETag: string;
    };
  }>(await res.text());

  return {
    location: parsed.CompleteMultipartUploadResult.Location,
    bucket: parsed.CompleteMultipartUploadResult.Bucket,
    key: parsed.CompleteMultipartUploadResult.Key,
    eTag: parsed.CompleteMultipartUploadResult.ETag,
  };
}
