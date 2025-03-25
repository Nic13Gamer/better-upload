export type Metadata = Record<string, unknown>;

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
  M extends Metadata,
  U extends boolean,
  T extends boolean,
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
      clientMetadata: Metadata;
    } & (U extends false
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
    | ({
        /**
         * Metadata sent to `onAfterSignedUrl`.
         */
        metadata?: M;

        /**
         * The bucket name to upload to.
         *
         * If you wish to upload to a different bucket than the one specified in the router.
         */
        bucketName?: string;
      } & (U extends false
        ? { objectKey?: string }
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
          }))
    | void
    | Promise<
        | ({
            /**
             * Metadata sent to `onAfterSignedUrl`.
             */
            metadata?: M;

            /**
             * The bucket name to upload to.
             *
             * If you wish to upload to a different bucket than the one specified in the router.
             */
            bucketName?: string;
          } & (U extends false
            ? { objectKey?: string }
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
              }))
        | void
      >;

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
      metadata: M;

      /**
       * Metadata sent from the client.
       */
      clientMetadata: Metadata;
    } & (U extends false
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
  ) => { metadata?: Metadata } | void | Promise<{ metadata?: Metadata } | void>;
} & (U extends true
  ? {
      /**
       * Allow more than one file to be uploaded.
       *
       * @default false
       */
      multipleFiles: U;

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
      multipleFiles?: U;
    }) &
  (T extends true
    ? {
        /**
         * Use multipart upload for large files.
         *
         * **Use this for files larger than 5GB.**
         *
         * @default false
         */
        multipart?: T;

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
        multipart?: T;
      });

export type Route = {
  maxFileSize?: number;
  fileTypes?: string[];
  signedUrlExpiresIn?: number;

  maxFiles?: number;

  multipart?: {
    partSize?: number;
    partSignedUrlExpiresIn?: number;
    completeSignedUrlExpiresIn?: number;
  };

  onBeforeUpload?: (data: {
    req: Request;
    clientMetadata: Metadata;
    files: Omit<UploadedFileInfo, 'objectKey'>[];
  }) => Promise<{
    metadata?: Metadata;
    bucketName?: string;
    generateObjectKey?: (data: {
      file: Omit<UploadedFileInfo, 'objectKey'>;
    }) => string | Promise<string>;
  } | void>;

  onAfterSignedUrl?: (data: {
    req: Request;
    metadata: Metadata;
    clientMetadata: Metadata;
    files: UploadedFileInfo[];
  }) => Promise<{ metadata?: Metadata } | void>;
};

export type ExecRoute = () => Route;
