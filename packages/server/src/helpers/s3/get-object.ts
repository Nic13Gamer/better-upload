import type { ObjectHeaders } from '@/types/s3';
import { defineHelper } from '@/utils/define-helper';
import { encodeObjectKey, parseObjectHeaders } from '@/utils/s3';

type GetObjectParams = {
  bucket: string;
  key: string;

  /**
   * The version ID of the object to get (if versioning is enabled).
   */
  versionId?: string;

  /**
   * The range of bytes to retrieve from the object.
   *
   * @example
   *
   * ```ts
   * range: 'bytes=0-1023' // Get the first 1024 bytes
   * ```
   */
  range?: string;
};

const sharedOpts = {
  method: 'GET',
  url: (params: GetObjectParams) => ({
    url: `/${encodeObjectKey(params.key)}`,
    searchParams: {
      versionId: params.versionId,
    },
  }),
  headers: (params: GetObjectParams) => ({
    range: params.range,
  }),
};

const blobHelper = defineHelper<
  GetObjectParams,
  {},
  ObjectHeaders & {
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
  }
>({
  ...sharedOpts,
  execute: {
    parseData: async (res) => ({
      blob: await res.blob(),
      ...parseObjectHeaders(res.headers),
    }),
  },
});

const streamHelper = defineHelper<
  GetObjectParams,
  {},
  ObjectHeaders & {
    /**
     * The object data as a ReadableStream.
     */
    stream: ReadableStream<Uint8Array<ArrayBufferLike>>;
  }
>({
  ...sharedOpts,
  execute: {
    parseData: async (res) => {
      if (!res.body) {
        throw new Error('S3 object response body is null.');
      }

      return {
        stream: res.body,
        ...parseObjectHeaders(res.headers),
      };
    },
  },
});

/**
 * Generate a pre-signed URL to get (download) an object from an S3 bucket.
 */
export const presignGetObject = blobHelper.presign;

/**
 * Get an object from an S3 bucket.
 *
 * This gets the entire object data, as a blob. To generate a pre-signed URL for getting an object on the client, use `presignGetObject`.
 */
export const getObjectBlob = blobHelper.execute;

/**
 * Get an object from an S3 bucket.
 *
 * This gets the entire object data, as a stream. To generate a pre-signed URL for getting an object on the client, use `presignGetObject`.
 */
export const getObjectStream = streamHelper.execute;
