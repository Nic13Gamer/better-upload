import { S3Client } from '@aws-sdk/client-s3';
import type { CreateTigrisClientParams } from '../types/internal';

/**
 * Create a Tigris client, compatible with the S3 API.
 *
 * Optionally, you can omit the parameters and use the following environment variables:
 * - `AWS_ACCESS_KEY_ID`
 * - `AWS_SECRET_ACCESS_KEY`
 * - `TIGRIS_ENDPOINT`
 */
export function tigris(params?: CreateTigrisClientParams) {
  const { accessKeyId, secretAccessKey, endpoint } = params ?? {
    accessKeyId:
      process.env.AWS_ACCESS_KEY_ID ||
      process.env.TIGRIS_ACCESS_KEY_ID ||
      process.env.TIGRIS_ACCESS_KEY,
    secretAccessKey:
      process.env.AWS_SECRET_ACCESS_KEY ||
      process.env.TIGRIS_SECRET_ACCESS_KEY ||
      process.env.TIGRIS_SECRET_KEY,
    endpoint: process.env.TIGRIS_ENDPOINT,
  };

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Missing required parameters for Tigris client.');
  }

  return new S3Client({
    region: 'auto',
    endpoint: endpoint ?? 'https://t3.storage.dev',
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: false,
  });
}
