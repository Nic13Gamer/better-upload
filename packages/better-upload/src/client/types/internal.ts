export type UploadRouterSuccessResponse = {
  files: {
    signedUrl: string;
    file: { objectKey: string; name: string; size: number; type: string };
  }[];
  metadata: Record<string, unknown>;
};

export type ServerMetadata = Record<string, unknown>;
