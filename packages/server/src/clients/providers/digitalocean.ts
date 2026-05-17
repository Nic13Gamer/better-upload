import { custom } from '../custom';

type Params = {
  /**
   * DigitalOcean Spaces region.
   */
  region: string;

  /**
   * DigitalOcean Spaces key.
   */
  key: string;

  /**
   * DigitalOcean Spaces secret.
   */
  secret: string;
};

/**
 * Create a DigitalOcean Spaces client.
 *
 * Optionally, you can omit the parameters and use the following environment variables:
 * - `SPACES_REGION`
 * - `SPACES_KEY`
 * - `SPACES_SECRET`
 */
export function digitalOcean(params?: Params) {
  const {
    region = process.env.AWS_REGION || process.env.SPACES_REGION,
    key = process.env.AWS_ACCESS_KEY_ID || process.env.SPACES_KEY,
    secret = process.env.AWS_SECRET_ACCESS_KEY || process.env.SPACES_SECRET,
  } = params ?? {};

  if (!region || !key || !secret) {
    throw new Error(
      'Missing required parameters for DigitalOcean Spaces client.'
    );
  }

  return custom({
    host: `${region}.digitaloceanspaces.com`,
    accessKeyId: key,
    secretAccessKey: secret,
    region: 'us-east-1',
    forcePathStyle: false,
  });
}
