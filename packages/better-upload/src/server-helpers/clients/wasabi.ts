import { S3Client } from '@aws-sdk/client-s3';
import type { CreateWasabiClientParams } from '../types/internal';

/**
 * Create a Wasabi client, compatible with the S3 API.
 *
 * Optionally, you can omit the parameters and use the following environment variables:
 * - `WASABI_REGION`
 * - `AWS_ACCESS_KEY_ID`
 * - `AWS_SECRET_ACCESS_KEY`
 */
export function wasabi(params?: CreateWasabiClientParams) {
  const { region, accessKeyId, secretAccessKey } = params ?? {
    region: process.env.AWS_REGION || process.env.WASABI_REGION,
    accessKeyId:
      process.env.AWS_ACCESS_KEY_ID ||
      process.env.WASABI_ACCESS_KEY_ID ||
      process.env.WASABI_ACCESS_KEY,
    secretAccessKey:
      process.env.AWS_SECRET_ACCESS_KEY ||
      process.env.WASABI_SECRET_ACCESS_KEY ||
      process.env.WASABI_SECRET_KEY,
  };

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing required parameters for Wasabi client.');
  }

  return new S3Client({
    endpoint: `https://s3.${region}.wasabisys.com`,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    apiVersion: '2006-03-01',
  });
}
