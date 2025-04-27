export type ObjectMetadata = Record<string, string>;
export type ServerMetadata = Record<string, unknown>;

export type UploadRouterSuccessResponse = {
  metadata: ServerMetadata;
} & (
  | {
      multipart: {
        files: {
          file: {
            objectKey: string;
            objectMetadata: ObjectMetadata;
            name: string;
            size: number;
            type: string;
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
      files: {
        signedUrl: string;
        file: {
          objectKey: string;
          objectMetadata: ObjectMetadata;
          name: string;
          size: number;
          type: string;
        };
      }[];
    }
);
