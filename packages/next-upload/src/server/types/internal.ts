import type { NextRequest } from 'next/server';

export type Metadata = Record<string, unknown>;
export type ClientMetadata = Record<string, unknown | undefined>;

export type UploadedFileInfo = {
  /**
   * The name of the file.
   */
  name: string;

  /**
   * File size in bytes.
   */
  size: number;

  /**
   * The MIME type of the file.
   */
  type: string;

  /**
   * The bucket key where the file will be uploaded to.
   */
  bucketKey: string;
};

export type ExecRoute = () => Route<any>;

export type Route<M> = {
  /**
   * Maximum file size in bytes.
   *
   * @default 1024 * 1024 * 5 // 5MB
   *
   * @example
   *
   * ```ts
   * maxFileSize: 1024 * 1024 * 10 // 10MB
   * ```
   */
  maxFileSize?: number;

  /**
   * Allowed file types.
   *
   * @default [] // All file types are allowed
   *
   * @example
   *
   * ```ts
   * fileTypes: ['image/png', 'image/jpeg'] // Only PNG and JPEG files are allowed
   * ```
   *
   * @example
   *
   * ```ts
   * fileTypes: ['image/*'] // All image files are allowed
   * ```
   */
  fileTypes?: string[];

  /**
   * The number of seconds the upload signed URL is valid for.
   *
   * @default 60
   *
   * @example
   *
   * ```ts
   * signedUrlExpiresIn: 300 // 5 minutes
   * ```
   */
  signedUrlExpiresIn?: number;

  /**
   * Use this callback to run custom logic before uploading a file, such as auth and rate-limiting. You can also return a custom bucket key.
   *
   * Metadata sent from the client is also available.
   *
   * Throw an `UploadFileError` to reject the file upload. This will also send the error message to the client.
   */
  onBeforeUpload?: (data: {
    /**
     * The incoming request from Next.js.
     */
    req: NextRequest;

    /**
     * Information about the file to be uploaded.
     */
    file: Omit<UploadedFileInfo, 'bucketKey'>;

    /**
     * Metadata sent from the client.
     */
    clientMetadata: ClientMetadata;
  }) =>
    | { bucketKey?: string; metadata?: M }
    | void
    | Promise<{ bucketKey?: string; metadata?: M } | void>;

  /**
   * Use this callback to run custom logic after creating the signed URL, such as saving data to a database.
   *
   * Metadata sent from `onBeforeUpload` is available as `metadata`. Metadata sent from the client is available as `clientMetadata`.
   *
   * You can return additional metadata to be sent back to the client, needs to be JSON serializable.
   */
  onAfterSignedUrl?: (data: {
    /**
     * The incoming request from Next.js.
     */
    req: NextRequest;

    /**
     * Information about the uploaded file, including the bucket key.
     */
    file: UploadedFileInfo;

    /**
     * Metadata sent from `onBeforeUpload`.
     */
    metadata: M;

    /**
     * Metadata sent from the client.
     */
    clientMetadata: ClientMetadata;
  }) =>
    | { metadata?: Record<string, unknown> }
    | void
    | Promise<{ metadata?: Record<string, unknown> } | void>;
};
