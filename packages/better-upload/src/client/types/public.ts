import type {
  DirectUploadResult,
  ObjectMetadata,
  ServerMetadata,
} from './internal';

export type ClientUploadError = {
  type:
    | 'unknown'
    | 'invalid_request'
    | 'no_files'
    | 's3_upload'
    | 'file_too_large'
    | 'invalid_file_type'
    | 'rejected'
    | 'too_many_files'
    | 'aborted';
  message: string;
};

export type UploadStatus = 'pending' | 'uploading' | 'complete' | 'failed';

export type FileUploadInfo<T extends UploadStatus> = {
  /**
   * The status of the file being uploaded.
   *
   * - `pending` - The file is waiting to be uploaded. The signed URL has already been generated.
   * - `uploading` - The file is currently being uploaded.
   * - `complete` - The file has been uploaded successfully.
   * - `error` - The file failed to upload.
   */
  status: T;

  /**
   * The progress of the upload, from 0 to 1.
   *
   * @example 0.5 // 50%
   */
  progress: number;

  /**
   * The key of the S3 object.
   */
  objectKey: string;

  /**
   * The metadata of the S3 object.
   */
  objectMetadata: ObjectMetadata;

  /**
   * The original file that was uploaded.
   */
  raw: File;

  /**
   * The name of the file.
   */
  name: string;

  /**
   * The size of the file in bytes.
   */
  size: number;

  /**
   * The type of the file.
   */
  type: string;
} & (T extends 'failed'
  ? {
      error: ClientUploadError;
    }
  : {});

export type UploadHookControl<T extends boolean> = {
  /**
   * Metadata sent back from the server.
   */
  metadata: ServerMetadata;

  /**
   * If a critical error occurred during the upload, and no files were able to be uploaded. For example, if your server is unreachable.
   *
   * Is also `true` if some input is invalid. For example, if no files were selected.
   */
  isError: boolean;

  /**
   * The error critical that occurred during the upload.
   *
   * @see `isError` for more information.
   */
  error: ClientUploadError | null;

  /**
   * If the upload is in progress.
   */
  isPending: boolean;

  /**
   * If the upload progress is complete. Regardless of if all files succeeded or failed to upload.
   */
  isSettled: boolean;

  /**
   * If the upload was aborted.
   */
  isAborted: boolean;

  /**
   * Reset the state of the upload.
   */
  reset: () => void;

  /**
   * Upload files to S3.
   *
   * Will throw if critical errors occur.
   */
  uploadAsync: (
    input: T extends true ? File[] | FileList : File,
    options?: { metadata?: ServerMetadata }
  ) => Promise<DirectUploadResult<T>>;

  /**
   * Upload files to S3.
   *
   * Will never throw an error.
   */
  upload: (
    input: T extends true ? File[] | FileList : File,
    options?: { metadata?: ServerMetadata }
  ) => Promise<DirectUploadResult<T>>;
} & (T extends true
  ? {
      /**
       * The progress of all files during the upload process.
       *
       * `uploadedFiles` and `failedFiles` derive from this array, use this to get information about **all** files.
       */
      progresses: FileUploadInfo<UploadStatus>[];

      /**
       * If all files succeeded to upload.
       */
      allSucceeded: boolean;

      /**
       * If some files failed to upload.
       */
      hasFailedFiles: boolean;

      /**
       * Files that succeeded to upload.
       */
      uploadedFiles: FileUploadInfo<'complete'>[];

      /**
       * Files that failed to upload.
       */
      failedFiles: FileUploadInfo<'failed'>[];

      /**
       * The progress of **all** files during the upload. Goes from 0 to 1.
       *
       * If one file is 100% complete, and another is 0% complete, this will be 0.5.
       *
       * @example 0.5 // 50%
       */
      averageProgress: number;
    }
  : {
      /**
       * The progress of the file during the upload process.
       */
      progress: number;

      /**
       * The file that was successfully uploaded.
       */
      uploadedFile: FileUploadInfo<'complete'> | null;

      /**
       * If the file was successfully uploaded.
       */
      isSuccess: boolean;
    });
