export type UploadedFile = {
  raw: File;
  name: string;
  size: number;
  type: string;
  objectKey: string;
};

export type ClientUploadFileError = {
  type:
    | 'unknown'
    | 'no_files'
    | 's3_upload'
    | 'file_too_large'
    | 'invalid_file_type'
    | 'rejected'
    | 'too_many_files';
  message: string | null;
};
