import type { Client } from '../clients';
import type { ExecRoute } from './internal';

export type Router = {
  /**
   * The S3 client.
   *
   * Import a client from `@better-upload/server/clients`.
   */
  client: Client;

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
