import { S3Error } from '@/error';
import type { ObjectHeaders } from '@/types/s3';
import type { Tagging } from '@repo/shared/types/s3';
import { parseXml } from './xml';

export const baseSignedUrl = (base: string, params: { expiresIn: number }) => {
  const url = new URL(base);
  url.searchParams.set('X-Amz-Expires', params.expiresIn.toString());
  return url;
};

export function encodeObjectKey(key: string) {
  if (!key.trim()) throw new Error('Object key cannot be empty.');
  return key.split('/').map(encodeURIComponent).join('/');
}

export async function throwS3Error(
  fn: Promise<Response>,
  opts?: {
    checkOk?: boolean;
  }
) {
  const res = await fn;

  if (!res.ok) {
    const text = await res.text();
    const parsed = parseXml<{
      Error: { Code: string; Message: string };
    }>(text);

    throw new S3Error(`${parsed.Error.Code} - ${parsed.Error.Message}`);
  }

  if (opts?.checkOk) {
    const cloned = res.clone();

    const text = await cloned.text();
    const parsed = parseXml<{
      Error?: { Code: string; Message: string };
    }>(text);

    if ('Error' in parsed && parsed.Error) {
      throw new S3Error(`${parsed.Error.Code} - ${parsed.Error.Message}`);
    }
  }

  return res;
}

export function parseObjectHeaders(headers: Headers): ObjectHeaders {
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
    taggingCount: Number(headers.get('x-amz-tagging-count') || 0),
  };
}

export async function sha256(input: string) {
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(input)
  );
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
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

export const encodeTagging = (tagging: Tagging) =>
  Object.entries(tagging)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join('&');

export const cleanUndefined = (obj: object) =>
  Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  );
