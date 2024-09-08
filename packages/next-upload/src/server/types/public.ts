import type { S3Client } from '@aws-sdk/client-s3';
import type { ExecRoute } from './internal';

export type Router = {
  client: S3Client;
  bucketName: string;
  routes: {
    [key: string]: ExecRoute;
  };
};
