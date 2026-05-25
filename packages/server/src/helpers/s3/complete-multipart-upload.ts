import { defineHelper } from '@/utils/define-helper';
import { encodeObjectKey } from '@/utils/s3';
import { parseXml, xml } from '@/utils/xml';

const helper = defineHelper<
  { bucket: string; key: string; uploadId: string },
  { parts: { partNumber: number; eTag: string }[] },
  { location: string; bucket: string; key: string; eTag: string }
>({
  method: 'POST',
  url: (params) => ({
    url: `/${encodeObjectKey(params.key)}`,
    searchParams: {
      uploadId: params.uploadId,
    },
  }),
  headers: () => ({
    'content-type': 'application/xml',
  }),
  execute: {
    buildBody: (params) => xml`
<CompleteMultipartUpload>
  ${params.parts
    .sort((a, b) => a.partNumber - b.partNumber)
    .map(
      (part) => xml`<Part>
    <PartNumber>${part.partNumber}</PartNumber>
    <ETag>${part.eTag}</ETag>
  </Part>`
    )}
</CompleteMultipartUpload>
`,
    checkOkResponse: true,
    parseData: async (res) => {
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
    },
  },
});

/**
 * Generate a pre-signed URL for completing a multipart upload in an S3 bucket.
 */
export const presignCompleteMultipartUpload = helper.presign;

/**
 * Complete a multipart upload in an S3 bucket.
 */
export const completeMultipartUpload = helper.execute;
