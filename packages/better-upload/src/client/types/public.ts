import type { ObjectMetadata } from './internal';

export type UploadedFile = {
  objectKey: string;
  objectMetadata: ObjectMetadata;
  raw: File;
  name: string;
  size: number;
  type: string;
};

export type ClientUploadFileError = {
  type:
    | 'unknown'
    | 'invalid_request'
    | 'no_files'
    | 's3_upload'
    | 'file_too_large'
    | 'invalid_file_type'
    | 'rejected'
    | 'too_many_files';
  message: string | null;
  objectKey?: string;
};
