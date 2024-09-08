export type ClientUploadFileError = {
  type: 'unknown' | 'file_too_large' | 'invalid_file_type' | 'rejected';
  message: string | null;
};
