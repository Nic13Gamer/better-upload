import { custom } from '../custom';

type Params = {
  /**
   * Cloudflare account ID.
   */
  accountId: string;

  /**
   * Cloudflare R2 access key ID.
   */
  accessKeyId: string;

  /**
   * Cloudflare R2 secret access key.
   */
  secretAccessKey: string;

  /**
   * The jurisdiction where the data is stored.
   *
   * Only use this if you created your R2 bucket using a jurisdiction.
   */
  jurisdiction?: 'eu' | 'fedramp';
};

/**
 * Create a Cloudflare R2 client.
 *
 * Optionally, you can omit the parameters and use the following environment variables:
 * - `CLOUDFLARE_ACCOUNT_ID`
 * - `AWS_ACCESS_KEY_ID`
 * - `AWS_SECRET_ACCESS_KEY`
 * - `CLOUDFLARE_JURISDICTION`
 */
export function cloudflare(params?: Params) {
  const {
    accountId = process.env.CLOUDFLARE_ACCOUNT_ID,
    accessKeyId = process.env.AWS_ACCESS_KEY_ID ||
      process.env.CLOUDFLARE_ACCESS_KEY_ID ||
      process.env.CLOUDFLARE_ACCESS_KEY,
    secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ||
      process.env.CLOUDFLARE_SECRET_ACCESS_KEY ||
      process.env.CLOUDFLARE_SECRET_KEY,
    jurisdiction = process.env.CLOUDFLARE_JURISDICTION ||
      process.env.CLOUDFLARE_R2_JURISDICTION,
  } = params ?? {};

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing required parameters for Cloudflare R2 client.');
  }

  return custom({
    host: `${accountId}.${jurisdiction ? `${jurisdiction}.` : ''}r2.cloudflarestorage.com`,
    accessKeyId,
    secretAccessKey,
    region: 'auto',
  });
}
