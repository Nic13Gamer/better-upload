import crypto from 'crypto';
import type { Client } from '@/types/clients';
import type { PostFileParams } from '@/utils/s3';
import type { PostFormData } from '@/types/s3';

// --- Type Definitions for Clarity and Safety ---

/**
 * Represents a condition in an S3 POST Policy.
 * Can be a simple object, a starts-with rule, or a content-length-range rule.
 */
export type PolicyCondition =
  | { [key: string]: string }
  | ['starts-with', string, string]
  | ['content-length-range', number, number];

/** The structure of the S3 POST Policy document. */
export interface PolicyDocument {
  expiration: string;
  conditions: PolicyCondition[];
}

/** The final object returned, containing the URL and the form fields. */
export interface PresignedPostData {
  url: string;
  fields: PostFormData['fields'];
}

/**
 * Converts a Date object to AWS AMZ date format for S3 operations.
 * The AMZ date format is used in AWS Signature Version 4 for timestamping requests.
 *
 * @param date - The date to convert
 *
 * @returns Date string in AWS AMZ format (YYYYMMDDTHHMMSSZ)
 *
 * @example
 * ```typescript
 * const date = new Date('2023-01-15T10:30:00Z');
 * toAmzDate(date); // Returns "20230115T103000Z"
 * ```
 */
export function toAmzDate(date: Date): string {
  return date.toISOString().slice(0, 19).replace(/[-:]/g, '') + 'Z';
}

/**
 * Converts a Date object to AWS datestamp format for S3 credential scoping.
 * The datestamp is used as part of the credential scope in AWS Signature Version 4.
 *
 * @param date - The date to convert
 *
 * @returns Date string in datestamp format (YYYYMMDD)
 *
 * @example
 * ```typescript
 * const date = new Date('2023-01-15T10:30:00Z');
 * toDatestamp(date); // Returns "20230115"
 * ```
 */
export function toDatestamp(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * Generates the AWS credential string for S3 Signature Version 4.
 * This credential string is used in both signed URLs and POST policies.
 *
 * @param client - S3-compatible client instance containing access key and region
 * @param date - The date for credential scoping
 *
 * @returns AWS credential string in the format: accessKeyId/datestamp/region/s3/aws4_request
 *
 * @example
 * ```typescript
 * const client = { s3: { accessKeyId: 'AKIA...', region: 'us-east-1' } };
 * const date = new Date('2023-01-15');
 * toAmzCredential(client, date); // Returns "AKIA.../20230115/us-east-1/s3/aws4_request"
 * ```
 */
export function toAmzCredential(client: Client, date: Date) {
  return `${client.s3.accessKeyId}/${toDatestamp(date)}/${client.s3.region}/s3/aws4_request`;
}

// --- Cryptographic Helper Functions (SigV4) ---

/**
 * Creates a HMAC-SHA256 hash.
 * @param key The secret key for the HMAC operation.
 * @param value The data to hash.
 * @returns A Buffer containing the hash.
 */
function hmac(key: string | Buffer, value: string | Buffer): Buffer {
  return crypto.createHmac('sha256', key).update(value).digest();
}

/**
 * Derives the AWS Signature Version 4 signing key using HMAC-SHA256.
 * This function implements the AWS SigV4 key derivation process by chaining HMAC operations
 * to create a service-specific signing key from the secret access key.
 *
 * @param client - S3-compatible client instance containing the secret access key and region
 * @param date - The date for key derivation scoping
 * @param serviceName - The AWS service name (typically 's3' for S3 operations)
 *
 * @returns Buffer containing the derived signing key for AWS Signature Version 4
 *
 * @example
 * ```typescript
 * const client = { s3: { secretAccessKey: 'secret', region: 'us-east-1' } };
 * const date = new Date();
 * const signingKey = getSignatureKey(client, date, 's3');
 * ```
 */
export function getSignatureKey(
  client: Client,
  date: Date,
  serviceName: string
): Buffer {
  const kDate = hmac('AWS4' + client.s3.secretAccessKey, toDatestamp(date));
  const kRegion = hmac(kDate, client.s3.region || '');
  const kService = hmac(kRegion, serviceName);
  return hmac(kService, 'aws4_request');
}

// --- Main Function ---

/**
 * Generates a complete presigned POST request for S3 browser-based file uploads.
 * This function creates all necessary form fields and signatures required for direct S3 uploads
 * using the AWS Signature Version 4 algorithm. The generated form data can be used directly
 * in HTML forms for browser-based file uploads.
 *
 * @param params - Upload parameters including bucket, key, content type, and metadata
 * @param client - S3-compatible client instance containing credentials and configuration
 * @param policy - S3 POST policy document defining upload conditions and constraints
 * @param now - Current date/time for signature calculation and timestamping
 *
 * @returns Object containing the S3 endpoint URL and all required form fields
 *
 * @example
 * ```typescript
 * const params = { bucket: 'my-bucket', key: 'file.jpg', contentType: 'image/jpeg' };
 * const policy = createPostPolicy(client, params, new Date(), 3600);
 * const postData = generateManualPresignedPost(params, client, policy, new Date());
 * // Use postData.url and postData.fields to create an HTML form
 * ```
 */
export function generateManualPresignedPost(
  params: PostFileParams,
  client: Client,
  policy: PolicyDocument,
  now: Date
): PresignedPostData {
  // 1. Base64 Encode the Policy
  const base64Policy = Buffer.from(JSON.stringify(policy)).toString('base64');

  // 2. Create the Signing Key
  const signingKey = getSignatureKey(client, now, 's3');

  // 3. Sign the Base64 Policy to create the signature
  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(base64Policy)
    .digest('hex');

  // 4. Build the form fields object with all required fields
  const fields: PostFormData['fields'] = {
    key: params.key,
    bucket: params.bucket,
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': toAmzCredential(client, now),
    'X-Amz-Date': toAmzDate(now),
    'content-type': params.contentType, // Note: lowercase as per S3 policy
    Policy: base64Policy,
    'X-Amz-Signature': signature,
  };

  // 5. Add optional fields based on params
  if (params.acl) {
    fields.acl = params.acl;
  }

  if (params.storageClass) {
    fields['x-amz-storage-class'] = params.storageClass;
  }

  if (params.cacheControl) {
    fields['Cache-Control'] = params.cacheControl;
  }

  // 6. Add metadata fields
  if (params.metadata) {
    Object.entries(params.metadata).forEach(([key, value]) => {
      fields[`x-amz-meta-${key.toLowerCase()}`] = value;
    });
  }

  return {
    url: client.buildBucketUrl(params.bucket),
    fields,
  };
}
