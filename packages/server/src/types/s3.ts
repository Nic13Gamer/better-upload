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

export type GetObjectBlobResult = ObjectHeaders & {
  /**
   * The object data as a Blob.
   *
   * @example
   *
   * ```ts
   * const text = await blob.text();
   * ```
   */
  blob: Blob;
};

export type GetObjectStreamResult = ObjectHeaders & {
  /**
   * The object data as a ReadableStream.
   */
  stream: ReadableStream<Uint8Array<ArrayBufferLike>>;
};
