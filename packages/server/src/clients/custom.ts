import type { Client, CustomClientParams } from '@/types/clients';
import { AwsClient } from 'aws4fetch';

export function custom(params?: CustomClientParams): Client {
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
    buildBucketUrl: (bucketName) =>
      `http${secure ? 's' : ''}://${
        forcePathStyle
          ? `${hostname}/${bucketName}`
          : `${bucketName}.${hostname}`
      }`,
    aws: new AwsClient({
      accessKeyId,
      secretAccessKey,
      region,
      service: 's3',
      retries: 0,
    }),
  };
}
