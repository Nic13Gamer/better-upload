import { custom } from '../custom';

type Params = {
  /**
   * MinIO region.
   */
  region: string;

  /**
   * MinIO access key ID.
   */
  accessKeyId: string;

  /**
   * MinIO secret access key.
   */
  secretAccessKey: string;

  /**
   * MinIO endpoint.
   */
  endpoint: string;
};

/**
 * Create a MinIO client.
 *
 * Optionally, you can omit the parameters and use the following environment variables:
 * - `AWS_REGION`
 * - `AWS_ACCESS_KEY_ID`
 * - `AWS_SECRET_ACCESS_KEY`
 * - `MINIO_ENDPOINT`
 */
export function minio(params?: Params) {
  const {
    region = process.env.AWS_REGION || process.env.MINIO_REGION,
    accessKeyId = process.env.AWS_ACCESS_KEY_ID ||
      process.env.MINIO_ACCESS_KEY_ID ||
      process.env.MINIO_ACCESS_KEY,
    secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ||
      process.env.MINIO_SECRET_ACCESS_KEY ||
      process.env.MINIO_SECRET_KEY,
    endpoint = process.env.AWS_ENDPOINT || process.env.MINIO_ENDPOINT,
  } = params ?? {};

  if (!region || !accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error('Missing required parameters for MinIO client.');
  }

  const url = new URL(endpoint);

  return custom({
    host: url.host,
    accessKeyId,
    secretAccessKey,
    region,
    forcePathStyle: true,
    secure: url.protocol === 'https:',
  });
}
