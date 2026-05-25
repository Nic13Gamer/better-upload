import type { ObjectHeaders } from '@/types/s3';
import { defineHelper } from '@/utils/define-helper';
import { encodeObjectKey, parseObjectHeaders } from '@/utils/s3';

const helper = defineHelper<
  {
    bucket: string;
    key: string;

    /**
     * The version ID of the object to head (if versioning is enabled).
     */
    versionId?: string;
  },
  {},
  ObjectHeaders
>({
  method: 'HEAD',
  url: (params) => ({
    url: `/${encodeObjectKey(params.key)}`,
    searchParams: {
      versionId: params.versionId,
    },
  }),
  execute: {
    parseData: async (res) => parseObjectHeaders(res.headers),
  },
});

/**
 * Generate a pre-signed URL for retrieving metadata of an object in an S3 bucket.
 *
 * Does not retrieve the object data itself.
 */
export const presignHeadObject = helper.presign;

/**
 * Head (retrieve metadata of) an object from an S3 bucket.
 *
 * Does not retrieve the object data itself.
 */
export const headObject = helper.execute;
