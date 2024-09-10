export type UploadedFile = {
  raw: File;
  name: string;
  size: number;
  type: string;
  bucketKey: string;
};

export type ClientUploadFileError = {
  type:
    | 'unknown'
    | 'file_too_large'
    | 'invalid_file_type'
    | 'rejected'
    | 'too_many_files';
  message: string | null;
};
