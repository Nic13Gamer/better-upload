import type { AwsClient } from 'aws4fetch';

export type ClientConfig = {
  buildBucketUrl: (bucketName: string) => string;
  awsClient: AwsClient;
};

export type CustomClientParams = {
  /**
   * Do not include `https://` or `http://`.
   *
   * @example s3.us-east-1.amazonaws.com
   */
  hostname: string;
  /**
   * Access key ID.
   */
  accessKeyId: string;
  /**
   * Secret access key.
   */
  secretAccessKey: string;
  /**
   * @default us-east-1
   */
  region?: string;
  /**
   * @default false
   */
  forcePathStyle?: boolean;
  /**
   * If HTTPS should be used.
   *
   * @default true
   */
  secure?: boolean;
};

export type AwsClientParams = {
  /**
   * AWS access key ID.
   */
  accessKeyId: string;
  /**
   * AWS secret access key.
   */
  secretAccessKey: string;
  /**
   * AWS region.
   */
  region: string;
};

export type CloudflareClientParams = {
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
