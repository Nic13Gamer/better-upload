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
import {
  generateManualPresignedPost,
  type PolicyDocument,
  toAmzCredential,
  toAmzDate,
} from '@/utils/sign';

const CONTENT_LENGTH_HEADROOM = 16 * 1024; // 16 KB for form fields

/**
 * Creates a base signed URL with expiration parameter for S3 operations.
 * This is a utility function used by other signing functions to add the common expiration parameter.
 *
 * @param base - The base URL for the S3 operation
 * @param params - Configuration object
 * @param params.expiresIn - Time in seconds until the URL expires
 *
 * @returns URL object with the expiration parameter set
 */
export const baseSignedUrl = (base: string, params: { expiresIn: number }) => {
  const url = new URL(base);
  url.searchParams.set('X-Amz-Expires', params.expiresIn.toString());
  return url;
};

/**
 * Executes an S3 operation and throws an S3Error if the response is not successful.
 * Parses XML error responses from S3 and converts them into structured errors.
 *
 * @param fn - Promise resolving to a Response from an S3 operation
 *
 * @returns Promise resolving to the successful Response
 *
 * @throws {S3Error} When the S3 operation fails, containing the error code and message from S3
 */
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

/**
 * Parses HTTP headers from an S3 HEAD object response into a structured result.
 * Extracts standard object information and custom metadata from the response headers.
 *
 * @param headers - HTTP headers from an S3 HEAD object response
 *
 * @returns Structured object containing content type, length, ETag, and custom metadata
 */
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

/**
 * Parameters for signing S3 PUT operations and creating POST forms.
 * Contains all the necessary information for uploading a file to S3.
 */
export type PostFileParams = {
  bucket: string;
  key: string;
  contentType: string;
  contentLength: number;
  metadata?: ObjectMetadata;
  acl?: ObjectAcl;
  storageClass?: StorageClass;
  cacheControl?: string;
  expiresIn: number;
};
/**
 * Generates a signed URL for uploading a file to S3 using the PUT method.
 * Creates a pre-signed URL that allows direct upload to S3 with specified parameters and metadata.
 *
 * @param client - S3-compatible client instance for signing operations
 * @param params - Upload parameters including bucket, key, content type, and optional metadata
 *
 * @returns Promise resolving to a signed URL string for PUT upload
 *
 * @throws {Error} When signing operation fails
 */
export async function signPutObject(client: Client, params: PostFileParams) {
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

/**
 * Initiates a multipart upload session for large files on S3.
 * Creates a new multipart upload and returns the upload ID needed for subsequent operations.
 *
 * @param client - S3-compatible client instance for the upload operation
 * @param params - Multipart upload parameters
 * @param params.bucket - S3 bucket name where the file will be uploaded
 * @param params.key - Object key (file path) in the bucket
 * @param params.contentType - MIME type of the file being uploaded
 * @param params.metadata - Optional custom metadata to attach to the object
 * @param params.acl - Optional access control list setting for the object
 * @param params.storageClass - Optional S3 storage class for the object
 * @param params.cacheControl - Optional cache control directive for the object
 *
 * @returns Promise resolving to an object containing the upload ID
 *
 * @throws {S3Error} When the multipart upload initiation fails
 */
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

/**
 * Generates a signed URL for uploading a single part in a multipart upload.
 * Each part of a multipart upload requires its own signed URL.
 *
 * @param client - S3-compatible client instance for signing operations
 * @param params - Part upload parameters
 * @param params.bucket - S3 bucket name where the file is being uploaded
 * @param params.key - Object key (file path) in the bucket
 * @param params.uploadId - Upload ID from the multipart upload session
 * @param params.partNumber - Sequential number of this part (starting from 1)
 * @param params.contentLength - Size of this part in bytes
 * @param params.expiresIn - Time in seconds until the URL expires
 *
 * @returns Promise resolving to a signed URL string for uploading this part
 *
 * @throws {Error} When signing operation fails
 */
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

/**
 * Generates a signed URL for completing a multipart upload.
 * This URL is used to finalize the multipart upload and combine all uploaded parts into the final object.
 *
 * @param client - S3-compatible client instance for signing operations
 * @param params - Complete upload parameters
 * @param params.bucket - S3 bucket name where the file is being uploaded
 * @param params.key - Object key (file path) in the bucket
 * @param params.uploadId - Upload ID from the multipart upload session
 * @param params.expiresIn - Time in seconds until the URL expires
 *
 * @returns Promise resolving to a signed URL string for completing the multipart upload
 *
 * @throws {Error} When signing operation fails
 */
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

/**
 * Generates a signed URL for aborting a multipart upload.
 * This URL can be used to cancel an in-progress multipart upload and clean up any uploaded parts.
 *
 * @param client - S3-compatible client instance for signing operations
 * @param params - Abort upload parameters
 * @param params.bucket - S3 bucket name where the file was being uploaded
 * @param params.key - Object key (file path) in the bucket
 * @param params.uploadId - Upload ID from the multipart upload session to abort
 * @param params.expiresIn - Time in seconds until the URL expires
 *
 * @returns Promise resolving to a signed URL string for aborting the multipart upload
 *
 * @throws {Error} When signing operation fails
 */
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

/**
 * Creates an S3 POST policy document for browser-based form uploads.
 * The policy defines the conditions and constraints for the upload, including expiration time.
 *
 * @param client - S3-compatible client instance for credential information
 * @param params - Upload parameters including bucket, key, content type, and optional metadata
 * @param date - Current date for policy creation and signature calculation
 * @param expiresInSeconds - Time in seconds until the policy expires
 *
 * @returns Policy document with expiration and conditions for the S3 POST upload
 */
export function createPostPolicy(
  client: Client,
  params: PostFileParams,
  date: Date,
  expiresInSeconds: number
): PolicyDocument {
  const expiration = new Date(date.getTime() + expiresInSeconds * 1000);
  const conditions: any[] = [
    { bucket: params.bucket },
    { key: params.key },
    { 'X-Amz-Algorithm': SIGNATURE_ALGORITHM },
    { 'X-Amz-Credential': toAmzCredential(client, date) },
    { 'X-Amz-Date': toAmzDate(date) },
    { 'content-type': params.contentType },
    // allow some headroom for the form fields accompanying the file
    ['content-length-range', params.contentLength, params.contentLength + CONTENT_LENGTH_HEADROOM],
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

  return {
    expiration: expiration.toISOString(),
    conditions,
  };
}

const SIGNATURE_ALGORITHM = 'AWS4-HMAC-SHA256';

/**
 * Generates a complete signed form for S3 POST uploads.
 * Creates all the necessary form fields and signatures required for browser-based direct uploads to S3.
 *
 * @param client - S3-compatible client instance for signing operations
 * @param params - Upload parameters including bucket, key, content type, and optional metadata
 * @param expiresInSeconds - Time in seconds until the form expires (default: 3600 seconds / 1 hour)
 *
 * @returns Complete POST form data with URL and signed fields ready for browser upload
 */
export function generateSignedForm(
  client: Client,
  params: PostFileParams,
  expiresInSeconds = 3600
): PostFormData {
  const now = new Date();
  const policy = createPostPolicy(client, params, now, expiresInSeconds);
  return generateManualPresignedPost(params, client, policy, now);
}
