import { deleteObjects } from '@/helpers/s3/delete-objects';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Client } from '@/types/clients';

describe('deleteObjects', () => {
  const mockFetch = vi.fn();
  const mockClient: Client = {
    buildBucketUrl: (bucket) => `https://${bucket}.s3.amazonaws.com`,
    s3: {
      fetch: mockFetch,
    } as any,
  };

  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('validation', () => {
    it('should throw error if no objects provided', async () => {
      await expect(
        deleteObjects(mockClient, {
          bucket: 'test-bucket',
          objects: [],
        })
      ).rejects.toThrow('No objects provided for deletion.');
    });

    it('should throw error if object key is empty', async () => {
      await expect(
        deleteObjects(mockClient, {
          bucket: 'test-bucket',
          objects: [{ key: '' }],
        })
      ).rejects.toThrow('Object keys cannot be empty.');

      await expect(
        deleteObjects(mockClient, {
          bucket: 'test-bucket',
          objects: [{ key: '  ' }], // should also trim
        })
      ).rejects.toThrow('Object keys cannot be empty.');
    });

    it('should throw error if more than 1000 objects provided', async () => {
      const objects = Array.from({ length: 1001 }, (_, i) => ({
        key: `file-${i}.txt`,
      }));

      await expect(
        deleteObjects(mockClient, {
          bucket: 'test-bucket',
          objects,
        })
      ).rejects.toThrow(
        'Cannot delete more than 1000 objects in a single request.'
      );
    });
  });

  describe('request construction', () => {
    it('should send correct request for single object', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => `
          <?xml version="1.0" encoding="UTF-8"?>
          <DeleteResult>
            <Deleted>
              <Key>file1.txt</Key>
            </Deleted>
          </DeleteResult>
        `,
      });

      const result = await deleteObjects(mockClient, {
        bucket: 'test-bucket',
        objects: [{ key: 'file1.txt' }],
      });

      expect(result).toEqual({
        deleted: [{ key: 'file1.txt' }],
        errors: [],
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0]!;

      expect(url).toBe('https://test-bucket.s3.amazonaws.com/?delete');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/xml');
      expect(options.headers['Content-MD5']).toBeDefined();
      expect(options.aws).toEqual({ signQuery: true, allHeaders: true });

      const body = options.body as string;
      expect(body).toContain('<Delete>');
      expect(body).toContain('<Object>');
      expect(body).toContain('<Key>file1.txt</Key>');
      expect(body).toContain('</Object>');
      expect(body).toContain('</Delete>');
    });

    it('should send correct request for multiple objects with versionId', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => `
          <?xml version="1.0" encoding="UTF-8"?>
          <DeleteResult>
            <Deleted>
              <Key>file1.txt</Key>
            </Deleted>
            <Deleted>
              <Key>file2.txt</Key>
              <VersionId>v123</VersionId>
            </Deleted>
          </DeleteResult>
        `,
      });

      const result = await deleteObjects(mockClient, {
        bucket: 'test-bucket',
        objects: [
          { key: 'file1.txt' },
          { key: 'file2.txt', versionId: 'v123' },
        ],
      });

      expect(result).toEqual({
        deleted: [
          { key: 'file1.txt' },
          { key: 'file2.txt', versionId: 'v123' },
        ],
        errors: [],
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0]!;
      const body = options.body as string;

      expect(body).toContain('<Key>file1.txt</Key>');
      expect(body).not.toContain('<VersionId>undefined</VersionId>'); // Should not be present for file1
      
      expect(body).toContain('<Key>file2.txt</Key>');
      expect(body).toContain('<VersionId>v123</VersionId>');
    });
  });

  describe('error handling', () => {
    it('should throw S3Error on error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        text: async () => `
          <?xml version="1.0" encoding="UTF-8"?>
          <Error>
            <Code>AccessDenied</Code>
            <Message>Access Denied</Message>
          </Error>
        `,
      });

      await expect(
        deleteObjects(mockClient, {
          bucket: 'test-bucket',
          objects: [{ key: 'file1.txt' }],
        })
      ).rejects.toThrow('AccessDenied - Access Denied');
    });

    it('should return errors for partial failures', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: async () => `
          <?xml version="1.0" encoding="UTF-8"?>
          <DeleteResult>
            <Deleted>
              <Key>file1.txt</Key>
            </Deleted>
            <Error>
              <Key>file2.txt</Key>
              <Code>AccessDenied</Code>
              <Message>Access Denied</Message>
            </Error>
          </DeleteResult>
        `,
      });

      const result = await deleteObjects(mockClient, {
        bucket: 'test-bucket',
        objects: [{ key: 'file1.txt' }, { key: 'file2.txt' }],
      });

      expect(result).toEqual({
        deleted: [{ key: 'file1.txt' }],
        errors: [
          {
            key: 'file2.txt',
            code: 'AccessDenied',
            message: 'Access Denied',
          },
        ],
      });
    });
  });
});
