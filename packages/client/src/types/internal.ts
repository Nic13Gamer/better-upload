import type {
  ClientUploadError,
  FileUploadInfo,
  UploadHookControl,
  UploadStatus,
} from './public';

/**
 * Metadata associated with S3 objects. Used for custom key-value pairs that are stored with the uploaded file.
 * All values must be strings as per S3 object metadata requirements.
 */
export type ObjectMetadata = Record<string, string>;

/**
 * Server metadata that can contain any type of data sent from the server during upload operations.
 * This is used to pass additional context or configuration from the server to the client.
 */
export type ServerMetadata = Record<string, unknown>;

/**
 * Form data structure for POST-based uploads to S3.
 * Contains the target URL and the form fields required for the upload.
 */
export type PostFormData = {
  /** The URL endpoint where the POST request should be sent */
  url: string;
  /** Key-value pairs of form fields required by S3 for the POST upload */
  fields: Record<string, string>;
};

/**
 * Response structure returned by the server when requesting signed URLs for file uploads.
 * Contains all necessary information to perform either single-part or multipart uploads.
 */
export type SignedUrlsSuccessResponse = {
  method: 'put' | 'post';
  metadata: ServerMetadata;
} & (
  | {
      multipart: {
        files: {
          file: {
            name: string;
            size: number;
            type: string;
            objectInfo: {
              key: string;
              metadata: ObjectMetadata;
              cacheControl?: string;
            };
          };
          parts: {
            signedUrl: string;
            partNumber: number;
            size: number;
          }[];
          uploadId: string;
          completeSignedUrl: string;
          abortSignedUrl: string;
        }[];
        partSize: number;
      };
    }
  | {
      files: Array<
        {
          file: {
            name: string;
            size: number;
            type: string;
            objectInfo: {
              key: string;
              metadata: ObjectMetadata;
              cacheControl?: string;
            };
          };
        } & ({ signedUrl: string } | { postForm: PostFormData })
      >;
    }
);

/**
 * Configuration properties for upload hooks, supporting both single and multiple file uploads.
 * Contains all the necessary options, callbacks, and event handlers for controlling file upload behavior.
 *
 * @template T - Boolean flag indicating whether this is for multiple file uploads (true) or single file upload (false)
 */
export type UploadHookProps<T extends boolean> = {
  /**
   * The API endpoint to use for uploading files.
   *
   * @default '/api/upload'
   */
  api?: string;

  /**
   * The route to use to upload the files. Should match the upload route name defined in the server.
   */
  route: string;

  /**
   * The number of parts that will be uploaded in parallel when uploading a file.
   *
   * **Only used in multipart uploads.**
   *
   * @default All parts at once.
   */
  multipartBatchSize?: number;

  /**
   * Callback that is called before requesting the pre-signed URLs. Use this to modify files before uploading them, like resizing or compressing.
   *
   * You can also throw an error to reject the file upload.
   */
  onBeforeUpload?: (
    data: T extends true ? { files: File[] } : { file: File }
  ) =>
    | void
    | (T extends true
        ? File[] | Promise<void | File[]>
        : File | Promise<void | File>);

  /**
   * Event that is called before the files start being uploaded to S3. This happens after the server responds with the pre-signed URL.
   */
  onUploadBegin?: (
    data: {
      /**
       * Metadata sent from the server.
       */
      metadata: ServerMetadata;
    } & (T extends true
      ? { files: FileUploadInfo<'pending'>[] }
      : { file: FileUploadInfo<'pending'> })
  ) => void;

  /**
   * Event that is called when a file upload progress changes.
   */
  onUploadProgress?: (data: { file: FileUploadInfo<UploadStatus> }) => void;

  /**
   * Event that is called after files are successfully uploaded.
   *
   * This event is called even if some files fail to upload, but some succeed. This event is not called if all files fail to upload.
   */
  onUploadComplete?: (
    data: {
      /**
       * Metadata sent back from the server.
       */
      metadata: ServerMetadata;
    } & (T extends true
      ? {
          files: FileUploadInfo<'complete'>[];
          failedFiles: FileUploadInfo<'failed'>[];
        }
      : { file: FileUploadInfo<'complete'> })
  ) => void | Promise<void>;

  /**
   * Event that is called after the upload settles (either successfully completed or an error occurs).
   */
  onUploadSettle?: (
    data: {
      /**
       * Metadata sent back from the server.
       */
      metadata: ServerMetadata;
    } & (T extends true
      ? {
          files: FileUploadInfo<'complete'>[];
          failedFiles: FileUploadInfo<'failed'>[];
        }
      : { file: FileUploadInfo<'complete'> })
  ) => void | Promise<void>;

  /**
   * Abort signal to cancel the upload.
   */
  signal?: AbortSignal;

  /**
   * Headers to send to your server when requesting the pre-signed URLs.
   */
  headers?: HeadersInit;

  /**
   * Credentials mode when requesting pre-signed URLs from your server.
   *
   * Use `include` to send cookies if your server is on a different origin.
   */
  credentials?: RequestCredentials;

  /**
   * Number of times to retry network requests that fail.
   *
   * @default 0
   */
  retry?: number;

  /**
   * Delay between retries in milliseconds.
   *
   * @default 0
   */
  retryDelay?: number;
} & (T extends true
  ? {
      /**
       * The size of the batch to upload files in parallel. Use `1` to upload files sequentially.
       *
       * By default, all files are uploaded in parallel.
       */
      uploadBatchSize?: number;

      /**
       * Event that is called after the entire upload if a file fails to upload.
       *
       * This event is called even if some files succeed to upload, but some fail. This event is not called if all files succeed.
       */
      onUploadFail?: (data: {
        /**
         * Metadata sent back from the server.
         */
        metadata: ServerMetadata;

        succeededFiles: FileUploadInfo<'complete'>[];
        failedFiles: FileUploadInfo<'failed'>[];
      }) => void | Promise<void>;

      /**
       * Event that is called if a critical error occurs before the upload to S3, and no files were able to be uploaded. For example, if your server is unreachable.
       *
       * Is also called some input is invalid. For example, if no files were selected.
       */
      onError?: (error: ClientUploadError) => void;
    }
  : {
      /**
       * Event that is called if the upload fails.
       *
       * Also called if some input is invalid. For example, if no files were selected.
       */
      onError?: (error: ClientUploadError) => void;
    });

/**
 * Return type for upload hooks, providing both direct access to upload controls
 * and a nested control object for convenience and backwards compatibility.
 *
 * @template T - Boolean flag indicating whether this is for multiple file uploads (true) or single file upload (false)
 */
export type UploadHookReturn<T extends boolean> = UploadHookControl<T> & {
  /** Nested control object containing the same upload control methods and properties */
  control: UploadHookControl<T>;
};

/**
 * Result returned from direct upload operations, containing uploaded files and server metadata.
 * The structure varies based on whether it's a single or multiple file upload operation.
 *
 * @template T - Boolean flag indicating whether this is for multiple file uploads (true) or single file upload (false)
 */
export type DirectUploadResult<T extends boolean> = {
  /**
   * Metadata sent back from the server.
   */
  metadata: ServerMetadata;
} & (T extends true
  ? {
      /**
       * Files that were successfully uploaded.
       */
      files: FileUploadInfo<'complete'>[];

      /**
       * Files that failed to upload.
       */
      failedFiles: FileUploadInfo<'failed'>[];
    }
  : {
      /**
       * The file that was successfully uploaded.
       */
      file: FileUploadInfo<'complete'>;
    });
