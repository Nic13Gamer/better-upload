import { S3Error } from '@/error';
import type { Client } from '@/types/clients';
import type {
  HeadObjectResult,
  ObjectAcl,
  ObjectMetadata,
  StorageClass,
} from '@/types/s3';
import { parseXml } from './xml';

export const baseSignedUrl = (base: string, params: { expiresIn: number }) => {
  const url = new URL(base);
  url.searchParams.set('X-Amz-Expires', params.expiresIn.toString());
  return url;
};

export async function throwS3Error(fn: Promise<Response>) {
  const res = await fn;

  if (!res.ok) {
    const text = await res.text();
    const parsed = parseXml<{
      Error: { Code: string; Message: string };
    }>(text);

    throw new S3Error(`${parsed.Error.Code} - ${parsed.Error.Message}`);
  }

  return res;
}

export function parseHeadObjectHeaders(headers: Headers): HeadObjectResult {
  const metadata: Record<string, string> = {};

  headers.forEach((value, key) => {
    if (key.toLowerCase().startsWith('x-amz-meta-')) {
      metadata[key.replace('x-amz-meta-', '')] = value;
    }
  });

  return {
    contentType: headers.get('content-type') || '',
    contentLength: Number(headers.get('content-length') || 0),
    eTag: headers.get('etag') || '',
    metadata,
  };
}

export async function signPutObject(
  client: Client,
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

  return (
    await client.s3.sign(url.toString(), {
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
        ...(params.acl ? { 'x-amz-acl': params.acl } : {}),
        ...(params.storageClass
          ? { 'x-amz-storage-class': params.storageClass }
          : {}),
      },
      aws: { signQuery: true, allHeaders: true },
    })
  ).url;
}

export async function createMultipartUpload(
  client: Client,
  params: {
    bucket: string;
    key: string;
    contentType: string;
    metadata?: ObjectMetadata;
    acl?: ObjectAcl;
    storageClass?: StorageClass;
    cacheControl?: string;
  }
) {
  const res = await throwS3Error(
    client.s3.fetch(
      `${client.buildBucketUrl(params.bucket)}/${params.key}?uploads`,
      {
        method: 'POST',
        headers: {
          'content-type': params.contentType,
          ...(params.acl ? { 'x-amz-acl': params.acl } : {}),
          ...(params.storageClass
            ? { 'x-amz-storage-class': params.storageClass }
            : {}),
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
      }
    )
  );

  const parsed = parseXml<{
    InitiateMultipartUploadResult: { UploadId: string };
  }>(await res.text());

  return {
    uploadId: parsed.InitiateMultipartUploadResult.UploadId,
  };
}

export async function signUploadPart(
  client: Client,
  params: {
    bucket: string;
    key: string;
    uploadId: string;
    partNumber: number;
    contentLength: number;
    expiresIn: number;
  }
) {
  const url = baseSignedUrl(
    `${client.buildBucketUrl(params.bucket)}/${params.key}`,
    {
      expiresIn: params.expiresIn,
    }
  );
  url.searchParams.set('partNumber', params.partNumber.toString());
  url.searchParams.set('uploadId', params.uploadId);

  return (
    await client.s3.sign(url.toString(), {
      method: 'PUT',
      headers: {
        'content-length': params.contentLength.toString(),
      },
      aws: { signQuery: true, allHeaders: true },
    })
  ).url;
}

export async function signCompleteMultipartUpload(
  client: Client,
  params: {
    bucket: string;
    key: string;
    uploadId: string;
    expiresIn: number;
  }
) {
  const url = baseSignedUrl(
    `${client.buildBucketUrl(params.bucket)}/${params.key}`,
    {
      expiresIn: params.expiresIn,
    }
  );
  url.searchParams.set('uploadId', params.uploadId);

  return (
    await client.s3.sign(url.toString(), {
      method: 'POST',
      aws: { signQuery: true, allHeaders: true },
    })
  ).url;
}

export async function signAbortMultipartUpload(
  client: Client,
  params: {
    bucket: string;
    key: string;
    uploadId: string;
    expiresIn: number;
  }
) {
  const url = baseSignedUrl(
    `${client.buildBucketUrl(params.bucket)}/${params.key}`,
    {
      expiresIn: params.expiresIn,
    }
  );
  url.searchParams.set('uploadId', params.uploadId);

  return (
    await client.s3.sign(url.toString(), {
      method: 'DELETE',
      aws: { signQuery: true, allHeaders: true },
    })
  ).url;
}

export function getBodyContentLength(body: BodyInit | null): number | null {
  if (body == null) return 0;

  if (typeof body === 'string') {
    return new TextEncoder().encode(body).length;
  }

  if (body instanceof Blob) {
    return body.size;
  }

  if (body instanceof ArrayBuffer) {
    return body.byteLength;
  }

  if (ArrayBuffer.isView(body)) {
    return body.byteLength;
  }

  if (body instanceof URLSearchParams) {
    return new TextEncoder().encode(body.toString()).length;
  }

  if (body instanceof FormData) {
    return null;
  }

  if (body instanceof ReadableStream) {
    return null;
  }

  return null;
}
