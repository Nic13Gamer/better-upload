import { listParts } from '@/helpers/s3/list-parts';
import type { Client } from '@/types/clients';
import { describe, expect, it, vi } from 'vitest';

const buildClient = (xml: string): Client =>
  ({
    buildBucketUrl: (bucket: string) => `https://${bucket}.s3.amazonaws.com`,
    s3: {
      fetch: vi.fn(async () => new Response(xml, { status: 200 })),
    },
  }) as unknown as Client;

const xml = (parts: string) => `<?xml version="1.0" encoding="UTF-8"?>
<ListPartsResult>
  <Bucket>my-bucket</Bucket>
  <Key>uploads/big.mp4</Key>
  <UploadId>upload-id-abc</UploadId>
  <PartNumberMarker>0</PartNumberMarker>
  <NextPartNumberMarker>2</NextPartNumberMarker>
  <MaxParts>1000</MaxParts>
  <IsTruncated>false</IsTruncated>
  ${parts}
</ListPartsResult>`;

describe('listParts', () => {
  it('parses a response with multiple parts', async () => {
    const client = buildClient(
      xml(`
      <Part>
        <PartNumber>1</PartNumber>
        <ETag>"etag-1"</ETag>
        <Size>5242880</Size>
        <LastModified>2024-01-01T00:00:00.000Z</LastModified>
      </Part>
      <Part>
        <PartNumber>2</PartNumber>
        <ETag>"etag-2"</ETag>
        <Size>5242880</Size>
        <LastModified>2024-01-01T00:00:01.000Z</LastModified>
      </Part>
    `)
    );

    const result = await listParts(client, {
      bucket: 'my-bucket',
      key: 'uploads/big.mp4',
      uploadId: 'upload-id-abc',
    });

    expect(result.bucket).toBe('my-bucket');
    expect(result.key).toBe('uploads/big.mp4');
    expect(result.uploadId).toBe('upload-id-abc');
    expect(result.isTruncated).toBe(false);
    expect(result.parts).toEqual([
      {
        partNumber: 1,
        eTag: '"etag-1"',
        size: 5242880,
        lastModified: new Date('2024-01-01T00:00:00.000Z'),
      },
      {
        partNumber: 2,
        eTag: '"etag-2"',
        size: 5242880,
        lastModified: new Date('2024-01-01T00:00:01.000Z'),
      },
    ]);
  });

  it('parses a single-part response (XML returns object, not array)', async () => {
    const client = buildClient(
      xml(`
      <Part>
        <PartNumber>1</PartNumber>
        <ETag>"only-etag"</ETag>
        <Size>1024</Size>
        <LastModified>2024-01-01T00:00:00.000Z</LastModified>
      </Part>
    `)
    );

    const result = await listParts(client, {
      bucket: 'my-bucket',
      key: 'uploads/big.mp4',
      uploadId: 'upload-id-abc',
    });

    expect(result.parts).toHaveLength(1);
    expect(result.parts[0]?.partNumber).toBe(1);
    expect(result.parts[0]?.eTag).toBe('"only-etag"');
  });

  it('parses an empty response (no parts uploaded yet)', async () => {
    const client = buildClient(xml(''));

    const result = await listParts(client, {
      bucket: 'my-bucket',
      key: 'uploads/big.mp4',
      uploadId: 'upload-id-abc',
    });

    expect(result.parts).toEqual([]);
  });

  it('passes pagination params to S3', async () => {
    const client = buildClient(xml(''));

    await listParts(client, {
      bucket: 'my-bucket',
      key: 'uploads/big.mp4',
      uploadId: 'upload-id-abc',
      maxParts: 500,
      partNumberMarker: 100,
    });

    const fetchMock = client.s3.fetch as ReturnType<typeof vi.fn>;
    const calledUrl = new URL(fetchMock.mock.calls[0]?.[0]);
    expect(calledUrl.searchParams.get('uploadId')).toBe('upload-id-abc');
    expect(calledUrl.searchParams.get('max-parts')).toBe('500');
    expect(calledUrl.searchParams.get('part-number-marker')).toBe('100');
  });

  it('throws when key is empty', async () => {
    const client = buildClient(xml(''));
    await expect(
      listParts(client, { bucket: 'my-bucket', key: '', uploadId: 'x' })
    ).rejects.toThrow('The object key cannot be empty.');
  });
});
