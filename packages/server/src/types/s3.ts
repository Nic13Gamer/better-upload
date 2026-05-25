import type { ObjectMetadata } from '@repo/shared/types/s3';

export type ObjectHeaders = {
  /**
   * The content type of the object.
   */
  contentType: string;

  /**
   * The size of the object in bytes.
   */
  contentLength: number;

  /**
   * The ETag of the object.
   *
   * Includes quotes (`""`) as returned by S3.
   */
  eTag: string;

  /**
   * Object metadata.
   *
   * Keys **do not** include the `x-amz-meta-` prefix.
   */
  metadata: ObjectMetadata;

  taggingCount: number;
};
