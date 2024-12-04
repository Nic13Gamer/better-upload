import { S3Client } from '@aws-sdk/client-s3';
import type { CreateMinioClientParams } from '../types/internal';

/**
 * Create a Minio client, compatible with the S3 API.
 *
 * Optionally, you can omit the parameters and use the following environment variables:
 * - `AWS_REGION`
 * - `AWS_ACCESS_KEY_ID`
 * - `AWS_SECRET_ACCESS_KEY`
 * - `MINIO_ENDPOINT`
 */
export function minio(params?: CreateMinioClientParams) {
  const { region, accessKeyId, secretAccessKey, endpoint } = params ?? {
    region: process.env.AWS_REGION || process.env.MINIO_REGION,
    accessKeyId:
      process.env.AWS_ACCESS_KEY_ID ||
      process.env.MINIO_ACCESS_KEY_ID ||
      process.env.MINIO_ACCESS_KEY,
    secretAccessKey:
      process.env.AWS_SECRET_ACCESS_KEY ||
      process.env.MINIO_SECRET_ACCESS_KEY ||
      process.env.MINIO_SECRET_KEY,
    endpoint: process.env.AWS_ENDPOINT || process.env.MINIO_ENDPOINT,
  };

  if (!region || !accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error('Missing required parameters for Minio client.');
  }

  return new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
}
