import type { LinodeClientParams } from '@/types/clients';
import { custom } from './custom';

/**
 * Create a Linode Object Storage client.
 *
 * Optionally, you can omit the parameters and use the following environment variables:
 * - `AWS_REGION` or `LINODE_REGION`
 * - `AWS_ACCESS_KEY_ID` or `LINODE_ACCESS_KEY`
 * - `AWS_SECRET_ACCESS_KEY` or `LINODE_SECRET_KEY`
 */
export function linode(params?: LinodeClientParams) {
  const {
    region = process.env.AWS_REGION || process.env.LINODE_REGION,
    accessKey = process.env.AWS_ACCESS_KEY_ID || process.env.LINODE_ACCESS_KEY,
    secretKey = process.env.AWS_SECRET_ACCESS_KEY ||
      process.env.LINODE_SECRET_KEY,
  } = params ?? {};

  if (!region || !accessKey || !secretKey) {
    throw new Error(
      'Missing required parameters for Linode Object Storage client.'
    );
  }

  return custom({
    host: `${region}.linodeobjects.com`,
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
    region: 'us-east-1',
    forcePathStyle: false,
  });
}
