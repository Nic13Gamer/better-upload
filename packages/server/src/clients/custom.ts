import type { ClientConfig, CustomClientParams } from '@/types/clients';

export function custom(params?: CustomClientParams): ClientConfig {
  const {
    hostname,
    accessKeyId = process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY,
    forcePathStyle = false,
    region = process.env.AWS_REGION ?? 'us-east-1',
    secure = true,
  } = params ?? {};

  if (!hostname || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing required parameters for Custom S3 client.');
  }

  return {
    buildBucketUrl: ({ bucketName }) =>
      `http${secure ? 's' : ''}://${
        forcePathStyle
          ? `${hostname}/${bucketName}`
          : `${bucketName}.${hostname}`
      }`,
    region: region || 'us-east-1',
    accessKeyId,
    secretAccessKey,
  };
}
