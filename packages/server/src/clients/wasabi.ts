import type { WasabiClientParams } from '@/types/clients';
import { custom } from './custom';

/**
 * Create a Wasabi client.
 *
 * Optionally, you can omit the parameters and use the following environment variables:
 * - `WASABI_REGION`
 * - `AWS_ACCESS_KEY_ID`
 * - `AWS_SECRET_ACCESS_KEY`
 */
export function wasabi(params?: WasabiClientParams) {
  const {
    region = process.env.AWS_REGION || process.env.WASABI_REGION,
    accessKeyId = process.env.AWS_ACCESS_KEY_ID ||
      process.env.WASABI_ACCESS_KEY_ID ||
      process.env.WASABI_ACCESS_KEY,
    secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ||
      process.env.WASABI_SECRET_ACCESS_KEY ||
      process.env.WASABI_SECRET_KEY,
  } = params ?? {};

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing required parameters for Wasabi client.');
  }

  return custom({
    host: `s3.${region}.wasabisys.com`,
    accessKeyId,
    secretAccessKey,
    region,
  });
}
