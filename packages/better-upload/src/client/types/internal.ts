export type UploadRouterSuccessResponse = {
  metadata: Record<string, unknown>;
} & (
  | {
      multipart: {
        files: {
          file: { objectKey: string; name: string; size: number; type: string };
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
        file: { objectKey: string; name: string; size: number; type: string };
      }[];
    }
);

export type ServerMetadata = Record<string, unknown>;
