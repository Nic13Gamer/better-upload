import type { Client } from '@/types/router/internal';
import { defineHelper } from '@/utils/define-helper';
import { encodeObjectKey, encodeTagging } from '@/utils/s3';
import type { Tagging } from '@repo/shared/types/s3';

type CopyObjectParams = {
  source: {
    bucket: string;
    key: string;
  };
  destination: {
    bucket: string;
    key: string;
  };
  taggingDirective?: 'COPY' | 'REPLACE';
  /**
   * Use only if `taggingDirective` is set to `REPLACE`.
   */
  tagging?: Tagging;
};

const helper = defineHelper<CopyObjectParams & { bucket: string }>({
  method: 'PUT',
  url: (params) => ({
    url: `/${encodeObjectKey(params.destination.key)}`,
  }),
  headers: (params) => ({
    'x-amz-copy-source': `${params.source.bucket}/${encodeObjectKey(params.source.key)}`,
    'x-amz-tagging-directive': params.taggingDirective,
    'x-amz-tagging': params.tagging ? encodeTagging(params.tagging) : undefined,
  }),
  execute: {
    checkOkResponse: true,
  },
});

/**
 * Generate a pre-signed URL for copying an object, within or between, S3 buckets.
 */
export function presignCopyObject(client: Client, params: CopyObjectParams) {
  return helper.presign(client, {
    ...params,
    bucket: params.destination.bucket,
  });
}

/**
 * Copy an object, within or between, S3 buckets.
 */
export async function copyObject(client: Client, params: CopyObjectParams) {
  await helper.execute(client, {
    ...params,
    bucket: params.destination.bucket,
  });
}
