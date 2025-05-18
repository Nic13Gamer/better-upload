import type { StandardSchemaV1 } from './standard-schema';

export type UnknownMetadata = Record<string, unknown>;
export type ObjectMetadata = Record<string, string>;

type ClientMetadata<T extends StandardSchemaV1 | undefined = undefined> =
  T extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<T> : unknown;

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
   * The object key where the file will be uploaded to.
   */
  objectKey: string;
};

export type RouteConfig<
  Multiple extends boolean,
  Multipart extends boolean,
  InterMetadata extends UnknownMetadata,
  ClientMetadataSchema extends StandardSchemaV1 | undefined,
> = {
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
   * This is not used for multipart uploads.
   *
   * @default 120
   *
   * @example
   *
   * ```ts
   * signedUrlExpiresIn: 300 // 5 minutes
   * ```
   */
  signedUrlExpiresIn?: number;

  /**
   * Schema for validating metadata sent from the client. You can use any validation library that is compatible with `standard-schema`.
   *
   * @example
   *
   * ```ts
   * clientMetadataSchema: z.object({
   *  title: z.string(),
   * })
   * ```
   */
  clientMetadataSchema?: ClientMetadataSchema;

  /**
   * Use this callback to run custom logic before uploading a file, such as auth and rate-limiting. You can also return a custom object key (return `generateObjectKey` for multiple files). This runs only once regardless of the number of files uploaded.
   *
   * Metadata sent from the client is also available.
   *
   * Throw an `UploadFileError` to reject the file upload. This will also send the error message to the client.
   */
  onBeforeUpload?: (
    data: {
      /**
       * The incoming request.
       */
      req: Request;

      /**
       * Metadata sent from the client.
       */
      clientMetadata: ClientMetadata<ClientMetadataSchema>;
    } & (Multiple extends false
      ? {
          /**
           * Information about the file to be uploaded.
           */
          file: Omit<UploadedFileInfo, 'objectKey'>;
        }
      : {
          /**
           * Information about the files to be uploaded.
           */
          files: Omit<UploadedFileInfo, 'objectKey'>[];
        })
  ) =>
    | BeforeUploadCallbackResult<Multiple, InterMetadata>
    | void
    | Promise<BeforeUploadCallbackResult<Multiple, InterMetadata> | void>;

  /**
   * Use this callback to run custom logic after creating the signed URL, such as saving data to a database. This runs only once regardless of the number of files uploaded.
   *
   * Metadata sent from `onBeforeUpload` is available as `metadata`. Metadata sent from the client is available as `clientMetadata`.
   *
   * You can return additional metadata to be sent back to the client, needs to be JSON serializable.
   */
  onAfterSignedUrl?: (
    data: {
      /**
       * The incoming request.
       */
      req: Request;

      /**
       * Metadata returned by `onBeforeUpload`.
       */
      metadata: InterMetadata;

      /**
       * Metadata sent from the client.
       */
      clientMetadata: ClientMetadata<ClientMetadataSchema>;
    } & (Multiple extends false
      ? {
          /**
           * Information about the uploaded file, including the object key.
           */
          file: UploadedFileInfo;
        }
      : {
          /**
           * Information about the uploaded files, including the object keys.
           */
          files: UploadedFileInfo[];
        })
  ) =>
    | AfterSignedUrlCallbackResult
    | void
    | Promise<AfterSignedUrlCallbackResult | void>;
} & (Multiple extends true
  ? {
      /**
       * Allow more than one file to be uploaded.
       *
       * @default false
       */
      multipleFiles: Multiple;

      /**
       * The maximum number of files that can be uploaded.
       *
       * @default 3
       */
      maxFiles?: number;
    }
  : {
      /**
       * Allow more than one file to be uploaded.
       *
       * @default false
       */
      multipleFiles?: Multiple;
    }) &
  (Multipart extends true
    ? {
        /**
         * Use multipart upload for large files.
         *
         * **Use this for files larger than 5GB.**
         *
         * @default false
         */
        multipart?: Multipart;

        /**
         * The size of each part in bytes.
         *
         * @default 1024 * 1024 * 50 // 50MB
         */
        partSize?: number;

        /**
         * The number of seconds the upload part pre-signed URL is valid for.
         *
         * @default 1500 // 25 minutes
         */
        partSignedUrlExpiresIn?: number;

        /**
         * The number of seconds the complete multipart upload pre-signed URL is valid for.
         *
         * @default 1800 // 30 minutes
         */
        completeSignedUrlExpiresIn?: number;
      }
    : {
        /**
         * Use multipart upload for large files.
         *
         * **Use this for files larger than 5GB.**
         *
         * @default false
         */
        multipart?: Multipart;
      });

type BeforeUploadCallbackResult<
  Multiple extends boolean,
  InterMetadata extends UnknownMetadata,
> = {
  /**
   * Metadata sent to `onAfterSignedUrl`.
   */
  metadata?: InterMetadata;

  /**
   * The bucket name to upload to.
   *
   * If you wish to upload to a different bucket than the one specified in the router.
   */
  bucketName?: string;
} & (Multiple extends false
  ? {
      /**
       * The object key to upload to.
       */
      objectKey?: string;

      /**
       * Custom object metadata for S3.
       *
       * **All keys will be lower cased.**
       *
       * **WARNING:** All values here will be exposed to the client. Do not use this for sensitive data.
       */
      objectMetadata?: ObjectMetadata;
    }
  : {
      /**
       * Use this callback to generate a custom object key for a file. Will be called for each file, in parallel.
       */
      generateObjectKey?: (data: {
        /**
         * Information about the file to be uploaded.
         */
        file: Omit<UploadedFileInfo, 'objectKey'>;
      }) => string | Promise<string>;

      /**
       * Use this callback to generate custom object metadata for S3. Will be called for each file, in parallel.
       *
       * **All keys will be lower cased.**
       *
       * **WARNING:** All values here will be exposed to the client. Do not use this for sensitive data.
       */
      generateObjectMetadata?: (data: {
        file: UploadedFileInfo;
      }) => ObjectMetadata | Promise<ObjectMetadata>;
    });

type AfterSignedUrlCallbackResult = {
  /**
   * Metadata sent back to the client.
   *
   * Needs to be JSON serializable.
   */
  metadata?: UnknownMetadata;
};

export type Route = {
  maxFileSize?: number;
  fileTypes?: string[];
  signedUrlExpiresIn?: number;
  clientMetadataSchema?: StandardSchemaV1;

  maxFiles?: number;

  multipart?: {
    partSize?: number;
    partSignedUrlExpiresIn?: number;
    completeSignedUrlExpiresIn?: number;
  };

  onBeforeUpload?: (data: {
    req: Request;
    clientMetadata: unknown;
    files: Omit<UploadedFileInfo, 'objectKey'>[];
  }) => Promise<{
    metadata?: UnknownMetadata;
    bucketName?: string;
    generateObjectKey?: (data: {
      file: Omit<UploadedFileInfo, 'objectKey'>;
    }) => string | Promise<string>;
    generateObjectMetadata?: (data: {
      file: UploadedFileInfo;
    }) => ObjectMetadata | Promise<ObjectMetadata>;
  } | void>;

  onAfterSignedUrl?: (data: {
    req: Request;
    metadata: UnknownMetadata;
    clientMetadata: unknown;
    files: UploadedFileInfo[];
  }) => Promise<{ metadata?: UnknownMetadata } | void>;
};

export type ExecRoute = () => Route;
