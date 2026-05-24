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
export type Tagging = Record<string, string>;

export type ObjectInfo = {
  /**
   * The S3 object key.
   */
  key: string;

  /**
   * Custom S3 object metadata.
   *
   * All keys are lower cased.
   */
  metadata: ObjectMetadata;
  acl?: ObjectAcl;
  storageClass?: StorageClass;

  /**
   * The Cache-Control header on the S3 object.
   */
  cacheControl?: string;
  tagging?: Tagging;
};
