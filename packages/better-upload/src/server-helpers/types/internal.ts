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

export type CreateCloudflareClientParams = {
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

  /**
   * The jurisdiction where the data is stored.
   *
   * Only use this if you created your R2 bucket using a jurisdiction.
   */
  jurisdiction?: 'eu' | 'fedramp';
};

export type CreateMinioClientParams = {
  /**
   * Minio region.
   */
  region: string;

  /**
   * Minio access key ID.
   */
  accessKeyId: string;

  /**
   * Minio secret access key.
   */
  secretAccessKey: string;

  /**
   * Minio endpoint.
   */
  endpoint: string;
};

export type CreateBackblazeClientParams = {
  /**
   * Backblaze B2 region.
   */
  region: string;

  /**
   * Backblaze B2 application key ID.
   */
  applicationKeyId: string;

  /**
   * Backblaze B2 application key.
   */
  applicationKey: string;
};

export type CreateWasabiClientParams = {
  /**
   * Wasabi region.
   */
  region: string;

  /**
   * Wasabi access key ID.
   */
  accessKeyId: string;

  /**
   * Wasabi secret access key.
   */
  secretAccessKey: string;
};

export type CreateDigitalOceanClientParams = {
  /**
   * DigitalOcean Spaces region.
   */
  region: string;

  /**
   * DigitalOcean Spaces key.
   */
  key: string;

  /**
   * DigitalOcean Spaces secret.
   */
  secret: string;
};

export type CreateTigrisClientParams = {
  /**
   * Tigris access key ID.
   */
  accessKeyId: string;

  /**
   * Tigris secret access key.
   */
  secretAccessKey: string;

  /**
   * Tigris endpoint.
   *
   * @default `https://t3.storage.dev`
   */
  endpoint?: string;
};
