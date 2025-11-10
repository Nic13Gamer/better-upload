import type { BackblazeClientParams } from '@/types/clients';
import { custom } from './custom';

/**
 * Create a Backblaze B2 client.
 *
 * Optionally, you can omit the parameters and use the following environment variables:
 * - `B2_REGION`
 * - `B2_APP_KEY_ID`
 * - `B2_APP_KEY`
 */
export function backblaze(params?: BackblazeClientParams) {
  const {
    region = process.env.AWS_REGION ||
      process.env.B2_REGION ||
      process.env.BACKBLAZE_REGION,
    applicationKeyId = process.env.AWS_ACCESS_KEY_ID ||
      process.env.B2_APP_KEY_ID ||
      process.env.BACKBLAZE_APP_KEY_ID,
    applicationKey = process.env.AWS_SECRET_ACCESS_KEY ||
      process.env.B2_APP_KEY ||
      process.env.BACKBLAZE_APP_KEY,
  } = params ?? {};

  if (!region || !applicationKeyId || !applicationKey) {
    throw new Error('Missing required parameters for Backblaze B2 client.');
  }

  return custom({
    host: `s3.${region}.backblazeb2.com`,
    accessKeyId: applicationKeyId,
    secretAccessKey: applicationKey,
    region,
  });
}
