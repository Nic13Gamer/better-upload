import type { NeonClientParams } from '@/types/clients';
import { custom } from './custom';

/**
 * Create a Neon Object Storage client.
 *
 * Optionally, you can omit the parameters and use the following environment variables:
 * - `AWS_ACCESS_KEY_ID`
 * - `AWS_SECRET_ACCESS_KEY`
 * - `AWS_ENDPOINT_URL_S3`
 * - `AWS_REGION` (optional, read from the endpoint if not set)
 *
 * These are the variables Neon injects into branches that have buckets, and that `neon env pull` writes locally.
 */
export function neon(params?: NeonClientParams) {
  const {
    accessKeyId = process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY,
    endpoint = process.env.AWS_ENDPOINT_URL_S3 || process.env.AWS_ENDPOINT_URL,
    region = process.env.AWS_REGION,
  } = params ?? {};

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error('Missing required parameters for Neon client.');
  }

  const url = new URL(endpoint);

  return custom({
    host: url.host,
    accessKeyId,
    secretAccessKey,
    region: region || regionFromHost(url.hostname) || 'us-east-2',
    forcePathStyle: true,
    secure: url.protocol === 'https:',
  });
}

/**
 * Branch endpoints look like `br-xxx.storage.c-1.us-east-2.aws.neon.tech`.
 */
function regionFromHost(hostname: string) {
  return hostname.match(
    /\.storage\.[^.]+\.([a-z0-9-]+)\.aws\.neon\.tech$/
  )?.[1];
}
