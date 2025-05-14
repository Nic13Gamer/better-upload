import { S3Client } from '@aws-sdk/client-s3';
import type { CreateDigitalOceanClientParams } from '../types/internal';

/**
 * Create a DigitalOcean Spaces client, compatible with the S3 API.
 *
 * Optionally, you can omit the parameters and use the following environment variables:
 * - `AWS_REGION`
 * - `AWS_ACCESS_KEY_ID`
 * - `AWS_SECRET_ACCESS_KEY`
 */
export function digitalOcean(params?: CreateDigitalOceanClientParams) {
  const { region, key, secretKey } = params ?? {
    region: process.env.AWS_REGION || process.env.DIGITALOCEAN_REGION,
    key:
      process.env.AWS_ACCESS_KEY_ID ||
      process.env.DIGITALOCEAN_ACCESS_KEY_ID ||
      process.env.DIGITALOCEAN_ACCESS_KEY,
    secretKey:
      process.env.AWS_SECRET_ACCESS_KEY ||
      process.env.DIGITALOCEAN_SECRET_ACCESS_KEY ||
      process.env.DIGITALOCEAN_SECRET_KEY,
  };

  if (!region || !key || !secretKey) {
    throw new Error('Missing required parameters for DigitalOcean client.');
  }

  return new S3Client({
    endpoint: `https://${region}.digitaloceanspaces.com`,
    region,
    credentials: {
      accessKeyId: key,
      secretAccessKey: secretKey,
    },
    forcePathStyle: true,
  });
}
