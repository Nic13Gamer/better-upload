import { randomBytes, subtle } from 'node:crypto';

const encoder = new TextEncoder();

export async function verifySignedUrl(
  url: string,
  {
    secretAccessKey,
    method,
    headers = {},
    now = new Date(),
  }: {
    secretAccessKey: string;
    method: string;
    headers?: Record<string, string>;
    now?: Date;
  }
) {
  const u = new URL(url);
  const q = u.searchParams;

  const requiredParams = [
    'X-Amz-Algorithm',
    'X-Amz-Credential',
    'X-Amz-Date',
    'X-Amz-Expires',
    'X-Amz-SignedHeaders',
    'X-Amz-Signature',
  ];
  if (requiredParams.some((p) => !q.has(p))) {
    return false;
  }

  const amzDateStr = q.get('X-Amz-Date')!;
  const amzExpires = parseInt(q.get('X-Amz-Expires')!, 10);
  const requestDate = parseAmzDate(amzDateStr);

  if (!requestDate) return false;

  const expiryDate = new Date(requestDate.getTime() + amzExpires * 1000);
  if (now > expiryDate) return false;

  const amzCredential = q.get('X-Amz-Credential')!;
  const credentialParts = amzCredential.split('/');
  if (credentialParts.length < 5) return false;

  const [_, dateStamp, region, service] = credentialParts;
  if (!dateStamp || !region || !service) return false;

  const canonicalQuery = Array.from(q.entries())
    .filter(([k]) => k !== 'X-Amz-Signature')
    .sort(([k1, v1], [k2, v2]) =>
      k1 < k2 ? -1 : k1 > k2 ? 1 : v1 < v2 ? -1 : v1 > v2 ? 1 : 0
    )
    .map(
      ([k, v]) =>
        `${encodeRfc3986(encodeURIComponent(k))}=${encodeRfc3986(encodeURIComponent(v))}`
    )
    .join('&');

  const amzSignedHeaders = q.get('X-Amz-SignedHeaders')!;
  const signedHeaders = amzSignedHeaders.split(';').map((h) => h.toLowerCase());

  const normalizedHeaders: Record<string, string> = { host: u.host };
  for (const [k, v] of Object.entries(headers)) {
    normalizedHeaders[k.toLowerCase()] = v.trim();
  }

  const canonicalHeaders = signedHeaders
    .map((h) => `${h}:${normalizedHeaders[h] ?? ''}\n`)
    .join('');

  const canonicalRequest = [
    method.toUpperCase(),
    u.pathname,
    canonicalQuery,
    canonicalHeaders,
    amzSignedHeaders,
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const canonicalHash = await sha256(canonicalRequest);
  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDateStr,
    scope,
    canonicalHash,
  ].join('\n');

  const kDate = await hmac(encoder.encode('AWS4' + secretAccessKey), dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  const signingKey = await hmac(kService, 'aws4_request');

  const providedSignature = q.get('X-Amz-Signature')!;
  const computedSignature = await hmacHex(signingKey, stringToSign);

  return computedSignature === providedSignature;
}

function parseAmzDate(s: string) {
  const match = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!match) return null;

  const [_, Y, M, D, h, m, sec] = match.map(Number);
  return new Date(Date.UTC(Y!, M! - 1, D, h, m, sec));
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('');
}

async function sha256(message: string) {
  const hash = await subtle.digest('SHA-256', encoder.encode(message));
  return toHex(hash);
}

async function hmac(key: BufferSource, data: string) {
  const importedKey = await subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return subtle.sign('HMAC', importedKey, encoder.encode(data));
}

async function hmacHex(key: BufferSource, data: string) {
  const signature = await hmac(key, data);
  return toHex(signature);
}

function encodeRfc3986(urlEncodedStr: string) {
  return urlEncodedStr.replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

export function generateMockCredentials() {
  const accessKeyId =
    'AKIA' +
    Array.from(
      crypto.getRandomValues(new Uint8Array(16)),
      (b) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[b % 36]
    ).join('');

  const secretAccessKey = randomBytes(30).toString('base64').slice(0, 40);

  return { accessKeyId, secretAccessKey };
}
