import type { S3Client } from '@aws-sdk/client-s3';
import type { ExecRoute } from './internal';

export type Router = {
  /**
   * The S3 client.
   */
  client: S3Client;

  /**
   * The name of the bucket where the files will be uploaded to.
   */
  bucketName: string;

  /**
   * The routes where files can be uploaded to.
   */
  routes: {
    [key: string]: ExecRoute;
  };
};
