import { S3Client } from '@aws-sdk/client-s3';
import type { CreateBackblazeClientParams } from '../types/internal';

/**
 * Create a Backblaze B2 client, compatible with the S3 API.
 *
 * Optionally, you can omit the parameters and use the following environment variables:
 * - `B2_REGION`
 * - `B2_APP_KEY_ID`
 * - `B2_APP_KEY`
 */
export function backblaze(params?: CreateBackblazeClientParams) {
  const { region, applicationKeyId, applicationKey } = params ?? {
    region:
      process.env.AWS_REGION ||
      process.env.B2_REGION ||
      process.env.BACKBLAZE_REGION,
    applicationKeyId:
      process.env.AWS_ACCESS_KEY_ID ||
      process.env.B2_APP_KEY_ID ||
      process.env.BACKBLAZE_APP_KEY_ID,
    applicationKey:
      process.env.AWS_SECRET_ACCESS_KEY ||
      process.env.B2_APP_KEY ||
      process.env.BACKBLAZE_APP_KEY,
  };

  if (!region || !applicationKeyId || !applicationKey) {
    throw new Error('Missing required parameters for Backblaze B2 client.');
  }

  return new S3Client({
    endpoint: `https://s3.${region}.backblazeb2.com`,
    region,
    credentials: {
      accessKeyId: applicationKeyId,
      secretAccessKey: applicationKey,
    },
  });
}
