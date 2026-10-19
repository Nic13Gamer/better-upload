import { neon } from '@/clients';
import { afterEach, describe, expect, test, vi } from 'vitest';

const endpoint = 'https://br-cool-fire-123.storage.c-7.us-east-2.aws.neon.tech';
const credentials = {
  accessKeyId: 'nak_live_test',
  secretAccessKey: 'secret',
};

describe('neon client', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('uses path-style bucket URLs', () => {
    const client = neon({ ...credentials, endpoint });

    expect(client.buildBucketUrl('uploads')).toBe(`${endpoint}/uploads`);
  });

  test('reads the region from the endpoint', () => {
    vi.stubEnv('AWS_REGION', '');
    const client = neon({ ...credentials, endpoint });

    expect(client.s3.region).toBe('us-east-2');
  });

  test('explicit region wins over the endpoint', () => {
    const client = neon({ ...credentials, endpoint, region: 'eu-central-1' });

    expect(client.s3.region).toBe('eu-central-1');
  });

  test('falls back to Neon environment variables', () => {
    vi.stubEnv('AWS_ACCESS_KEY_ID', credentials.accessKeyId);
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', credentials.secretAccessKey);
    vi.stubEnv('AWS_ENDPOINT_URL_S3', endpoint);
    vi.stubEnv('AWS_REGION', 'us-east-2');
    const client = neon();

    expect(client.buildBucketUrl('uploads')).toBe(`${endpoint}/uploads`);
    expect(client.s3.region).toBe('us-east-2');
  });

  test('throws without an endpoint', () => {
    vi.stubEnv('AWS_ENDPOINT_URL_S3', '');
    vi.stubEnv('AWS_ENDPOINT_URL', '');

    expect(() => neon({ ...credentials } as never)).toThrow(
      'Missing required parameters for Neon client.'
    );
  });
});
