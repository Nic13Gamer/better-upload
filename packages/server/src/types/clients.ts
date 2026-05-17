import type { AwsClient } from 'aws4fetch';

export type Client = {
  buildBucketUrl: (bucketName: string) => string;
  s3: AwsClient;
};
