import type { TigrisClientParams } from '@/types/clients';
import { custom } from './custom';

/**
 * Create a Tigris client.
 *
 * Optionally, you can omit the parameters and use the following environment variables:
 * - `AWS_ACCESS_KEY_ID`
 * - `AWS_SECRET_ACCESS_KEY`
 * - `TIGRIS_ENDPOINT`
 */
export function tigris(params?: TigrisClientParams) {
  const {
    accessKeyId = process.env.AWS_ACCESS_KEY_ID ||
      process.env.TIGRIS_ACCESS_KEY_ID ||
      process.env.TIGRIS_ACCESS_KEY,
    secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ||
      process.env.TIGRIS_SECRET_ACCESS_KEY ||
      process.env.TIGRIS_SECRET_KEY,
    endpoint = process.env.TIGRIS_ENDPOINT,
  } = params ?? {};

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Missing required parameters for Tigris client.');
  }

  return custom({
    host: endpoint ? new URL(endpoint).host : 't3.storage.dev',
    accessKeyId,
    secretAccessKey,
    region: 'auto',
    forcePathStyle: false,
  });
}
