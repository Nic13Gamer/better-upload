import type { AwsClientParams } from '@/types/clients';
import { custom } from './custom';

/**
 * Create an AWS S3 client.
 *
 * Optionally, you can omit the parameters and use the following environment variables:
 * - `AWS_ACCESS_KEY_ID`
 * - `AWS_SECRET_ACCESS_KEY`
 * - `AWS_REGION`
 * - `AWS_SESSION_TOKEN` (optional)
 */
export function aws(params?: AwsClientParams) {
  const {
    accessKeyId = process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY,
    region = process.env.AWS_REGION,
    sessionToken = process.env.AWS_SESSION_TOKEN,
  } = params ?? {};

  if (!accessKeyId || !secretAccessKey || !region) {
    throw new Error('Missing required parameters for AWS S3 client.');
  }

  return custom({
    host: `s3.${region}.amazonaws.com`,
    accessKeyId,
    secretAccessKey,
    sessionToken,
    region,
  });
}
