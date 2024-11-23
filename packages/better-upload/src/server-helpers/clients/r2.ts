import { S3Client } from '@aws-sdk/client-s3';
import type { CreateR2ClientParams } from '../types/internal';

/**
 * Create a Cloudflare R2 client, compatible with the S3 API.
 *
 * Optionally, you can omit the parameters and use the following environment variables:
 * - `CLOUDFLARE_ACCOUNT_ID`
 * - `AWS_ACCESS_KEY_ID`
 * - `AWS_SECRET_ACCESS_KEY`
 * - `CLOUDFLARE_JURISDICTION`
 */
export function r2(params?: CreateR2ClientParams) {
  const { accountId, accessKeyId, secretAccessKey, jurisdiction } = params ?? {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    accessKeyId:
      process.env.AWS_ACCESS_KEY_ID ||
      process.env.CLOUDFLARE_ACCESS_KEY_ID ||
      process.env.CLOUDFLARE_ACCESS_KEY,
    secretAccessKey:
      process.env.AWS_SECRET_ACCESS_KEY ||
      process.env.CLOUDFLARE_SECRET_ACCESS_KEY ||
      process.env.CLOUDFLARE_SECRET_KEY,
    jurisdiction:
      process.env.CLOUDFLARE_JURISDICTION ||
      process.env.CLOUDFLARE_R2_JURISDICTION,
  };

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing required parameters for R2 client.');
  }

  return new S3Client({
    endpoint: `https://${accountId}.${jurisdiction ? `${jurisdiction}.` : ''}r2.cloudflarestorage.com`,
    region: 'auto',
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
  });
}
