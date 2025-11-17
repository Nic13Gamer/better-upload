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
};

export type GetObjectResult = HeadObjectResult & {
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

/**
 * Presigned POST form data for S3 uploads
 */
export type PostFormData = {
  /**
   * The URL to POST the form to
   */
  url: string;

  /**
   * Form fields to include in the POST request
   */
  fields: {
    key: string;
    'Content-Type': string;
    bucket: string;
    'X-Amz-Algorithm': string;
    'X-Amz-Credential': string;
    'X-Amz-Date': string;
    Policy: string;
    'X-Amz-Signature': string;
    [key: string]: string; // Additional metadata fields
  };
};
