export type ObjectAcl =
  | 'authenticated-read'
  | 'aws-exec-read'
  | 'bucket-owner-full-control'
  | 'bucket-owner-read'
  | 'private'
  | 'public-read'
  | 'public-read-write';

export type StorageClass =
  | 'DEEP_ARCHIVE'
  | 'EXPRESS_ONEZONE'
  | 'FSX_OPENZFS'
  | 'GLACIER'
  | 'GLACIER_IR'
  | 'INTELLIGENT_TIERING'
  | 'ONEZONE_IA'
  | 'OUTPOSTS'
  | 'REDUCED_REDUNDANCY'
  | 'SNOW'
  | 'STANDARD'
  | 'STANDARD_IA';

export type ObjectMetadata = Record<string, string>;

export type HeadObjectResult = {
  contentType: string;
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
};

export type GetObjectResult = HeadObjectResult & {
  blob: Blob;
};
