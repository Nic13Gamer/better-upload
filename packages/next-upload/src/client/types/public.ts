export type ClientUploadFileError = {
  type:
    | 'unknown'
    | 'file_too_large'
    | 'invalid_file_type'
    | 'rejected'
    | 'too_many_files';
  message: string | null;
};
