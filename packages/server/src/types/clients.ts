export type ClientConfig = {
  buildBucketUrl: (params: { bucketName: string }) => string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
};

export type CustomClientParams = {
  /**
   * Do not include `https://` or `http://`.
   *
   * @example r2.cloudflarestorage.com
   */
  hostname: string;
  accessKeyId: string;
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
