import type { Client } from '@/types/clients';
import { AwsClient } from 'aws4fetch';

type Params = {
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
   * Region.
   *
   * You can omit this to use the `AWS_REGION` environment variable, or it will default to `us-east-1`.
   *
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
   *
   * You can omit this to use the `AWS_SESSION_TOKEN` environment variable.
   */
  sessionToken?: string;
};

/**
 * Create a custom S3 client.
 *
 * Works with any S3-compatible storage service.
 *
 * @example
 *
 * ```ts
 * const s3 = custom({
 *   host: 's3.us-east-1.amazonaws.com',
 *   accessKeyId: 'your-access-key-id',
 *   secretAccessKey: 'your-secret-access-key',
 *   region: 'us-east-1',
 *   secure: true,
 *   forcePathStyle: false,
 *   sessionToken: '...',
 * });
 * ```
 */
export function custom(params: Params): Client {
  const {
    host,
    accessKeyId = process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY,
    forcePathStyle = false,
    region = process.env.AWS_REGION ?? 'us-east-1',
    secure = true,
    sessionToken = process.env.AWS_SESSION_TOKEN,
  } = params ?? {};

  if (!host || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing required parameters for Custom S3 client.');
  }

  return {
    buildBucketUrl: (bucketName) => {
      const safe = bucketName.replace(/[/:@#?\\]/g, '');

      return `http${secure ? 's' : ''}://${
        forcePathStyle ? `${host}/${safe}` : `${safe}.${host}`
      }`;
    },
    s3: new AwsClient({
      accessKeyId,
      secretAccessKey,
      sessionToken,
      region,
      service: 's3',
      retries: 0,
    }),
  };
}
