import type { AwsClient } from 'aws4fetch';

export type Client = {
  buildBucketUrl: (bucketName: string) => string;
  s3: AwsClient;
};

export type CustomClientParams = {
  /**
   * Do not include `https://` or `http://`.
   *
   * @deprecated use `host` instead
   *
   * @example
   *
   * ```ts
   * hostname: 's3.us-east-1.amazonaws.com'
   * ```
   */
  hostname?: string;

  /**
   * Do not include `https://` or `http://`.
   *
   * @example
   *
   * ```ts
   * host: 's3.us-east-1.amazonaws.com'
   * host: 'localhost:9000'
   * ```
   */
  host: string;

  /**
   * Access key ID.
   *
   * You can omit this to use the `AWS_ACCESS_KEY_ID` environment variable.
   */
  accessKeyId?: string;

  /**
   * Secret access key.
   *
   * You can omit this to use the `AWS_SECRET_ACCESS_KEY` environment variable.
   */
  secretAccessKey?: string;

  /**
   * @default 'us-east-1'
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

  /**
   * Session token for temporary credentials.
   */
  sessionToken?: string;
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

  /**
   * AWS session token for temporary credentials.
   */
  sessionToken?: string;
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

export type BackblazeClientParams = {
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

export type DigitalOceanClientParams = {
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

export type MinioClientParams = {
  /**
   * MinIO region.
   */
  region: string;

  /**
   * MinIO access key ID.
   */
  accessKeyId: string;

  /**
   * MinIO secret access key.
   */
  secretAccessKey: string;

  /**
   * MinIO endpoint.
   */
  endpoint: string;
};

export type TigrisClientParams = {
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
   * @default 'https://t3.storage.dev'
   */
  endpoint: string;
};

export type WasabiClientParams = {
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
