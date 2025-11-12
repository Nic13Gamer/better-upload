import type { Client, CustomClientParams } from '@/types/clients';
import { AwsClient } from 'aws4fetch';

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
export function custom(params: CustomClientParams): Client {
  const {
    hostname,
    host: _host,
    accessKeyId = process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY,
    forcePathStyle = false,
    region = process.env.AWS_REGION ?? 'us-east-1',
    secure = true,
    sessionToken,
  } = params ?? {};

  if ((!_host && !hostname) || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing required parameters for Custom S3 client.');
  }

  const host = _host ?? hostname;

  return {
    buildBucketUrl: (bucketName) =>
      `http${secure ? 's' : ''}://${
        forcePathStyle ? `${host}/${bucketName}` : `${bucketName}.${host}`
      }`,
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
