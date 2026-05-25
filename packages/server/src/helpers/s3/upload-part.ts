import { defineHelper } from '@/utils/define-helper';
import { encodeObjectKey } from '@/utils/s3';

const helper = defineHelper<
  {
    bucket: string;
    key: string;
    uploadId: string;
    partNumber: number;
    contentLength?: number;
  },
  { body: BodyInit },
  { eTag: string }
>({
  method: 'PUT',
  url: (params) => ({
    url: `/${encodeObjectKey(params.key)}`,
    searchParams: {
      partNumber: params.partNumber,
      uploadId: params.uploadId,
    },
  }),
  headers: (params) => ({
    'content-length': params.contentLength?.toString(),
  }),
  execute: {
    buildBody: (params) => params.body,
    parseData: async (res) => ({
      eTag: res.headers.get('etag') || '',
    }),
  },
});

/**
 * Generate a pre-signed URL to upload a part in a multipart upload to an S3 bucket.
 */
export const presignUploadPart = helper.presign;

/**
 * Upload a part in a multipart upload to an S3 bucket.
 */
export const uploadPart = helper.execute;
