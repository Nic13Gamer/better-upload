export type UploadedFile = {
  raw: File;
  name: string;
  size: number;
  type: string;
  bucketKey: string;
};
