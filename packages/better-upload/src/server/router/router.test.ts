import { describe, expect, it } from 'vitest';
import { testRequest, testRouter, uploadBody } from '../utils/internal/tests';
import { handleRequest } from './request-handler';

describe('router', () => {
  it('should reject invalid method', async () => {
    const res = await handleRequest(testRequest({ method: 'GET' }), testRouter);
    const json = await res.json();

    expect(res.status).toBe(405);
    expect(json).toEqual({
      error: {
        type: 'invalid_request',
        message: 'Method not allowed.',
      },
    });
  });

  it('should reject invalid JSON body', async () => {
    const res = await handleRequest(
      testRequest({ method: 'POST', body: 'invalid-json' }),
      testRouter
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({
      error: {
        type: 'invalid_request',
        message: 'Invalid JSON body.',
      },
    });
  });

  it('should reject invalid upload schema', async () => {
    const res = await handleRequest(
      testRequest({
        method: 'POST',
        body: JSON.stringify({ invalid: 'data' }),
      }),
      testRouter
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({
      error: {
        type: 'invalid_request',
        message: 'Invalid file upload schema.',
      },
    });
  });

  it('should reject non-existing upload route', async () => {
    const res = await handleRequest(
      testRequest({
        method: 'POST',
        body: uploadBody({
          route: 'nonExisting',
          files: [{ name: 'file1.jpg', size: 500000, type: 'image/jpeg' }],
        }),
      }),
      testRouter
    );
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json).toEqual({
      error: {
        type: 'invalid_request',
        message: 'Upload route not found.',
      },
    });
  });

  it('should reject multiple files on single file route', async () => {
    const res = await handleRequest(
      testRequest({
        method: 'POST',
        body: uploadBody({
          route: 'singleImage',
          files: [
            { name: 'file1.jpg', size: 500000, type: 'image/jpeg' },
            { name: 'file2.jpg', size: 400000, type: 'image/jpeg' },
          ],
        }),
      }),
      testRouter
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({
      error: {
        type: 'too_many_files',
        message: 'Multiple files are not allowed.',
      },
    });
  });

  it('should reject invalid client metadata', async () => {
    const res = await handleRequest(
      testRequest({
        method: 'POST',
        body: uploadBody({
          route: 'withMetaSchema',
          files: [{ name: 'file1.jpg', size: 500000, type: 'image/jpeg' }],
          metadata: { name: 123 }, // Invalid, should be string
        }),
      }),
      testRouter
    );
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json).toEqual({
      error: {
        type: 'invalid_request',
        message: 'Invalid metadata.',
      },
    });
  });

  describe('non multipart handler', () => {
    it('should reject too many files', async () => {
      const res = await handleRequest(
        testRequest({
          method: 'POST',
          body: uploadBody({
            route: 'multipleImages',
            files: [
              { name: 'file1.jpg', size: 500000, type: 'image/jpeg' },
              { name: 'file2.jpg', size: 400000, type: 'image/jpeg' },
              { name: 'file3.jpg', size: 300000, type: 'image/jpeg' },
              { name: 'file4.jpg', size: 200000, type: 'image/jpeg' },
            ],
          }),
        }),
        testRouter
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({
        error: {
          type: 'too_many_files',
          message: 'Too many files.',
        },
      });
    });

    it('should reject file too large', async () => {
      const res = await handleRequest(
        testRequest({
          method: 'POST',
          body: uploadBody({
            route: 'singleImage',
            files: [
              { name: 'file1.jpg', size: 1024 * 1024 * 10, type: 'image/jpeg' },
            ],
          }),
        }),
        testRouter
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({
        error: {
          type: 'file_too_large',
          message: 'One or more files are too large.',
        },
      });
    });

    it('should reject S3 file size 5gb limit', async () => {
      const res = await handleRequest(
        testRequest({
          method: 'POST',
          body: uploadBody({
            route: 'singleImage',
            files: [
              {
                name: 'file1.jpg',
                size: 1024 * 1024 * 6000,
                type: 'image/jpeg',
              },
            ],
          }),
        }),
        testRouter
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({
        error: {
          type: 'file_too_large',
          message:
            'One or more files exceed the S3 limit of 5GB. Use multipart upload for larger files.',
        },
      });
    });

    it('should reject invalid file type', async () => {
      const res = await handleRequest(
        testRequest({
          method: 'POST',
          body: uploadBody({
            route: 'singleImage',
            files: [
              { name: 'file1.pdf', size: 500000, type: 'application/pdf' },
            ],
          }),
        }),
        testRouter
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({
        error: {
          type: 'invalid_file_type',
          message: 'One or more files have an invalid file type.',
        },
      });
    });

    it('should reject upload in onBeforeUpload', async () => {
      const res = await handleRequest(
        testRequest({
          method: 'POST',
          body: uploadBody({
            route: 'alwaysReject',
            files: [{ name: 'file1.jpg', size: 500000, type: 'image/jpeg' }],
          }),
        }),
        testRouter
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json).toEqual({
        error: {
          type: 'rejected',
          message: 'Test reject',
        },
      });
    });

    it('should accept valid upload with custom bucket', async () => {
      const res = await handleRequest(
        testRequest({
          method: 'POST',
          body: uploadBody({
            route: 'customBucket',
            files: [{ name: 'file1.jpg', size: 500000, type: 'image/jpeg' }],
          }),
        }),
        testRouter
      );
      const json = await res.json();

      expect(json.files[0].signedUrl).toContain('my-custom-bucket');

      json.files[0].signedUrl = 'signed-url-placeholder';

      expect(res.status).toBe(200);
      expect(json).toMatchSnapshot();
    });

    it('should accept valid single file upload request', async () => {
      const res = await handleRequest(
        testRequest({
          method: 'POST',
          body: uploadBody({
            route: 'singleImage',
            files: [{ name: 'file1.jpg', size: 500000, type: 'image/jpeg' }],
          }),
        }),
        testRouter
      );
      const json = await res.json();

      json.files[0].signedUrl = 'signed-url-placeholder';

      expect(res.status).toBe(200);
      expect(json).toMatchSnapshot();
    });

    it('should accept valid multiple files upload request', async () => {
      const res = await handleRequest(
        testRequest({
          method: 'POST',
          body: uploadBody({
            route: 'multipleImages',
            files: [
              { name: 'file1.jpg', size: 500000, type: 'image/jpeg' },
              { name: 'file2.png', size: 400000, type: 'image/png' },
            ],
          }),
        }),
        testRouter
      );
      const json = await res.json();

      json.files[0].signedUrl = 'signed-url-placeholder';
      json.files[1].signedUrl = 'signed-url-placeholder';

      expect(res.status).toBe(200);
      expect(json).toMatchSnapshot();
    });
  });

  // describe('multipart handler', () => {
  //   // Multipart handler tests go here
  // });
});
