import { S3Error } from '@/error';
import type { Client } from '@/types/clients';
import type {
  HeadObjectResult,
  ObjectAcl,
  ObjectMetadata,
  PostFormData,
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

  if (params.acl) {
    url.searchParams.set('x-amz-acl', params.acl);
  }
  if (params.storageClass) {
    url.searchParams.set('x-amz-storage-class', params.storageClass);
  }

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

export function createPostPolicy(params: {
  bucket: string;
  key: string;
  contentType: string;
  contentLength: number;
  metadata?: ObjectMetadata;
  acl?: ObjectAcl;
  storageClass?: StorageClass;
  cacheControl?: string;
  expiresIn: number;
}): { policy: string; conditions: any[] } {
  const expiration = new Date(Date.now() + params.expiresIn * 1000);

  const conditions: any[] = [
    { bucket: params.bucket },
    { key: params.key },
    { 'Content-Type': params.contentType },
    ['content-length-range', params.contentLength, params.contentLength],
  ];

  // Add optional conditions
  if (params.acl) {
    conditions.push({ acl: params.acl });
  }
  if (params.storageClass) {
    conditions.push({ 'x-amz-storage-class': params.storageClass });
  }
  if (params.cacheControl) {
    conditions.push({ 'Cache-Control': params.cacheControl });
  }

  // Add metadata conditions
  if (params.metadata) {
    Object.entries(params.metadata).forEach(([key, value]) => {
      conditions.push({ [`x-amz-meta-${key.toLowerCase()}`]: value });
    });
  }

  const policyDocument = {
    expiration: expiration.toISOString(),
    conditions,
  };

  const policy = btoa(JSON.stringify(policyDocument));

  return { policy, conditions };
}

export async function signPostObject(
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
): Promise<PostFormData> {
  const { policy } = createPostPolicy(params);

  // Create the form fields
  const fields: PostFormData['fields'] = {
    key: params.key,
    'Content-Type': params.contentType,
    bucket: params.bucket,
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': '', // Will be filled by client.s3.sign
    'X-Amz-Date': '', // Will be filled by client.s3.sign
    Policy: policy,
    'X-Amz-Signature': '', // Will be filled by client.s3.sign
  };

  // Add optional fields
  if (params.acl) {
    fields.acl = params.acl;
  }
  if (params.storageClass) {
    fields['x-amz-storage-class'] = params.storageClass;
  }
  if (params.cacheControl) {
    fields['Cache-Control'] = params.cacheControl;
  }

  // Add metadata fields
  if (params.metadata) {
    Object.entries(params.metadata).forEach(([key, value]) => {
      fields[`x-amz-meta-${key.toLowerCase()}`] = value;
    });
  }

  // Use the client to sign the POST policy
  const bucketUrl = client.buildBucketUrl(params.bucket);
  const signResult = await client.s3.sign(bucketUrl, {
    method: 'POST',
    body: policy,
    aws: { signQuery: false, allHeaders: false },
  });

  // Extract signing information from the signed request
  const url = new URL(signResult.url);
  const signedHeaders = signResult.headers || {};

  // Update fields with actual signing information
  const xAmzCredential = signedHeaders.get('x-amz-credential');
  if (xAmzCredential != null) {
    fields['X-Amz-Credential'] = xAmzCredential;
  }

  const xAmzDate = signedHeaders.get("x-amz-date");
  if (xAmzDate != null) {
    fields['X-Amz-Date'] = xAmzDate;
  }

  const xAmzSignature = signedHeaders.get("x-amz-signature");
  if (xAmzSignature != null) {
    fields['X-Amz-Signature'] = xAmzSignature;
  }

  return {
    url: bucketUrl,
    fields,
  };
}
