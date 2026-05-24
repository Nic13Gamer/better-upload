import type { ObjectInfo } from './s3';

export type UnknownMetadata = Record<string, unknown>;

export type UploadRequestSuccessResponse = {
  metadata: Record<string, unknown>;
} & (
  | {
      multipart: {
        partSize: number;
        uploads: ({
          file: {
            _id: number;
            name: string;
            size: number;
            type: string;
            objectInfo: ObjectInfo;
          };
        } & (
          | {
              parts: {
                signedUrl: string;
                partNumber: number;
                size: number;
              }[];
              uploadId: string;
              completeSignedUrl: string;
              abortSignedUrl: string;
            }
          | { skip: 'completed' }
        ))[];
      };
    }
  | {
      uploads: ({
        file: {
          _id: number;
          name: string;
          size: number;
          type: string;
          objectInfo: ObjectInfo;
        };
      } & (
        | {
            signedUrl: string;
            headers: Record<string, string>;
          }
        | { skip: 'completed' }
      ))[];
    }
);

export type UploadRequestErrorResponse = {
  error: {
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
};
