import type { S3Client } from '@aws-sdk/client-s3';

export type HelperBaseParams = {
  /**
   * The S3 client.
   */
  client: S3Client;

  /**
   * The name of the bucket where the file is stored.
   */
  bucketName: string;
};

export type CreateR2ClientParams = {
  /**
   * Cloudflare account ID.
   */
  accountId: string;

  /**
   * Cloudflare R2 access key ID.
   */
  accessKeyId: string;

  /**
   * Cloudflare R2 secret access key.
   */
  secretAccessKey: string;
};
