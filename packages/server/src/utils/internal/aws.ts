import type { ObjectAcl, StorageClass } from '@/types/aws';
import type { ClientConfig } from '@/types/clients';
import type { ObjectMetadata } from '@/types/router/internal';

export const baseSignedUrl = (base: string, params: { expiresIn: number }) => {
  const url = new URL(base);
  url.searchParams.set('X-Amz-Expires', params.expiresIn.toString());
  return url;
};

export async function signPutObject(
  client: ClientConfig,
  params: {
    bucket: string;
    key: string;
    contentType: string;
    contentLength: number;
    metadata?: ObjectMetadata;
    acl?: ObjectAcl;
    storageClass?: StorageClass;
    cacheControl?: string;
    expiresIn: number;
  }
) {
  const url = baseSignedUrl(
    `${client.buildBucketUrl(params.bucket)}/${params.key}`,
    {
      expiresIn: params.expiresIn,
    }
  );
  url.searchParams.set('X-Amz-Content-Sha256', 'UNSIGNED-PAYLOAD');

  if (params.acl) {
    url.searchParams.set('x-amz-acl', params.acl);
  }
  if (params.storageClass) {
    url.searchParams.set('x-amz-storage-class', params.storageClass);
  }

  return (
    await client.awsClient.sign(url.toString(), {
      method: 'PUT',
      headers: {
        'content-length': params.contentLength.toString(),
        'content-type': params.contentType,
        ...(params.cacheControl
          ? { 'cache-control': params.cacheControl }
          : {}),
        ...Object.fromEntries(
          Object.entries(params.metadata || {}).map(([key, value]) => [
            `x-amz-meta-${key.toLowerCase()}`,
            value,
          ])
        ),
      },
      aws: { signQuery: true, allHeaders: true },
    })
  ).url;
}
