import { S3Client } from '@aws-sdk/client-s3';
import type { CreateDigitalOceanClientParams } from '../types/internal';

/**
 * Create a DigitalOcean Spaces client, compatible with the S3 API.
 *
 * Optionally, you can omit the parameters and use the following environment variables:
 * - `SPACES_REGION`
 * - `SPACES_KEY`
 * - `SPACES_SECRET`
 */
export function digitalOcean(params?: CreateDigitalOceanClientParams) {
  const { region, key, secret } = params ?? {
    region: process.env.AWS_REGION || process.env.SPACES_REGION,
    key: process.env.AWS_ACCESS_KEY_ID || process.env.SPACES_KEY,
    secret: process.env.AWS_SECRET_ACCESS_KEY || process.env.SPACES_SECRET,
  };

  if (!region || !key || !secret) {
    throw new Error(
      'Missing required parameters for DigitalOcean Spaces client.'
    );
  }

  return new S3Client({
    endpoint: `https://${region}.digitaloceanspaces.com`,
    region: 'us-east-1',
    credentials: {
      accessKeyId: key,
      secretAccessKey: secret,
    },
    forcePathStyle: false,
  });
}
