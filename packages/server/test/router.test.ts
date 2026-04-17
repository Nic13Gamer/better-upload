import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as z from 'zod/mini';
import {
  createTestRouter,
  routerRequest,
  routerUploadBody,
} from './utils/router';

vi.mock('@/utils/s3', async (importOriginal) => ({
  ...(await importOriginal()),
  createMultipartUpload: vi.fn(async () => ({
    uploadId: 'mock-upload-id',
  })),
}));

vi.mock('@/helpers/s3/list-parts', () => ({
  listParts: vi.fn(async () => ({
    bucket: 'my-default-bucket',
    key: 'mock-key',
    uploadId: 'mock-upload-id',
    partNumberMarker: undefined,
    nextPartNumberMarker: undefined,
    maxParts: 1000,
    isTruncated: false,
    parts: [],
  })),
}));

import { S3Error } from '@/error';
import { listParts } from '@/helpers/s3/list-parts';
import { handleRequest, RejectUpload, route } from '@/router';
import { createMultipartUpload } from '@/utils/s3';

describe('request handler', () => {
  const { router } = createTestRouter({
    routes: {
      singleImage: route({
        maxFileSize: 1024 * 1024 * 5, // 5MB
        fileTypes: ['image/*'],
      }),
      withMetaSchema: route({
        clientMetadataSchema: z.object({
          name: z.string(),
        }),
      }),
    },
  });

  it('should reject invalid method', async () => {
    const res = await handleRequest(routerRequest({ method: 'GET' }), router);
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
      routerRequest({ method: 'POST', body: 'invalid-json' }),
      router
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
      routerRequest({
        method: 'POST',
        body: JSON.stringify({ invalid: 'data' }),
      }),
      router
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
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'nonExisting',
          files: [{ name: 'file1.jpg', size: 500000, type: 'image/jpeg' }],
        }),
      }),
      router
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
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'singleImage',
          files: [
            { name: 'file1.jpg', size: 500000, type: 'image/jpeg' },
            { name: 'file2.jpg', size: 400000, type: 'image/jpeg' },
          ],
        }),
      }),
      router
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

  it('should reject invalid metadata', async () => {
    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'withMetaSchema',
          files: [{ name: 'file1.jpg', size: 500000, type: 'image/jpeg' }],
          metadata: { invalid: 'data' },
        }),
      }),
      router
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
});

describe('files handler', () => {
  const { router } = createTestRouter({
    routes: {
      multipleImages: route({
        multipleFiles: true,
        maxFiles: 3,
        maxFileSize: 1024 * 1024 * 5, // 5MB
        fileTypes: ['image/*'],
        onBeforeUpload() {
          return {
            generateObjectInfo: ({ file }) => ({
              key: `multiple/${file.name}`,
            }),
          };
        },
      }),
      singleImage: route({
        maxFileSize: 1024 * 1024 * 5, // 5MB
        fileTypes: ['image/*'],
        onBeforeUpload({ file }) {
          return {
            objectInfo: { key: `single/${file.name}` },
          };
        },
      }),
      alwaysReject: route({
        onBeforeUpload() {
          throw new RejectUpload('Test reject');
        },
      }),
      customBucket: route({
        onBeforeUpload({ file }) {
          return {
            bucketName: 'my-custom-bucket',
            objectInfo: { key: `custom/${file.name}` },
          };
        },
      }),
    },
  });

  it('should reject too many files', async () => {
    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'multipleImages',
          files: [
            { name: 'file1.jpg', size: 500000, type: 'image/jpeg' },
            { name: 'file2.jpg', size: 400000, type: 'image/jpeg' },
            { name: 'file3.jpg', size: 300000, type: 'image/jpeg' },
            { name: 'file4.jpg', size: 200000, type: 'image/jpeg' },
          ],
        }),
      }),
      router
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
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'singleImage',
          files: [
            { name: 'file1.jpg', size: 1024 * 1024 * 10, type: 'image/jpeg' },
          ],
        }),
      }),
      router
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
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'singleImage',
          files: [
            {
              name: 'file1.jpg',
              size: 6 * 1024 * 1024 * 1024,
              type: 'image/jpeg',
            },
          ],
        }),
      }),
      router
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
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'singleImage',
          files: [{ name: 'file1.pdf', size: 500000, type: 'application/pdf' }],
        }),
      }),
      router
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
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'alwaysReject',
          files: [{ name: 'file1.jpg', size: 500000, type: 'image/jpeg' }],
        }),
      }),
      router
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
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'customBucket',
          files: [{ name: 'file1.jpg', size: 500000, type: 'image/jpeg' }],
        }),
      }),
      router
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.files[0].signedUrl).toContain('my-custom-bucket');
    expect(json.files[0].signedUrl).not.toContain('my-default-bucket');

    json.files[0].signedUrl = 'signed-url-placeholder';
    expect(json).toMatchSnapshot();
  });

  it('should accept valid single file upload request', async () => {
    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'singleImage',
          files: [{ name: 'file1.jpg', size: 500000, type: 'image/jpeg' }],
        }),
      }),
      router
    );
    const json = await res.json();

    expect(res.status).toBe(200);

    json.files[0].signedUrl = 'signed-url-placeholder';
    expect(json).toMatchSnapshot();
  });

  it('should accept valid multiple files upload request', async () => {
    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'multipleImages',
          files: [
            { name: 'file1.jpg', size: 500000, type: 'image/jpeg' },
            { name: 'file2.png', size: 400000, type: 'image/png' },
          ],
        }),
      }),
      router
    );
    const json = await res.json();

    expect(res.status).toBe(200);

    json.files[0].signedUrl = 'signed-url-placeholder';
    json.files[1].signedUrl = 'signed-url-placeholder';
    expect(json).toMatchSnapshot();
  });
});

describe('multipart handler', () => {
  const { router } = createTestRouter({
    routes: {
      multipleImages: route({
        multipart: true,
        multipleFiles: true,
        maxFiles: 3,
        maxFileSize: 1024 * 1024 * 500, // 500MB
        fileTypes: ['image/*'],
        onBeforeUpload() {
          return {
            generateObjectInfo: ({ file }) => ({
              key: `multiple/${file.name}`,
            }),
          };
        },
      }),
      singleImage: route({
        multipart: true,
        maxFileSize: 1024 * 1024 * 500, // 500MB
        fileTypes: ['image/*'],
        onBeforeUpload({ file }) {
          return {
            objectInfo: { key: `single/${file.name}` },
          };
        },
      }),
      alwaysReject: route({
        multipart: true,
        onBeforeUpload() {
          throw new RejectUpload('Test reject');
        },
      }),
      customBucket: route({
        multipart: true,
        onBeforeUpload({ file }) {
          return {
            bucketName: 'my-custom-bucket',
            objectInfo: { key: `custom/${file.name}` },
          };
        },
      }),
    },
  });

  it('should reject too many files', async () => {
    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'multipleImages',
          files: [
            { name: 'file1.jpg', size: 50000000, type: 'image/jpeg' },
            { name: 'file2.jpg', size: 40000000, type: 'image/jpeg' },
            { name: 'file3.jpg', size: 30000000, type: 'image/jpeg' },
            { name: 'file4.jpg', size: 20000000, type: 'image/jpeg' },
          ],
        }),
      }),
      router
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
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'singleImage',
          files: [
            { name: 'file1.jpg', size: 1024 * 1024 * 600, type: 'image/jpeg' },
          ],
        }),
      }),
      router
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

  it('should reject invalid file type', async () => {
    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'singleImage',
          files: [
            { name: 'file1.pdf', size: 50000000, type: 'application/pdf' },
          ],
        }),
      }),
      router
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
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'alwaysReject',
          files: [{ name: 'file1.jpg', size: 500000, type: 'image/jpeg' }],
        }),
      }),
      router
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
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'customBucket',
          files: [{ name: 'file1.jpg', size: 500000, type: 'image/jpeg' }],
        }),
      }),
      router
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.multipart.files[0].parts[0].signedUrl).toContain(
      'my-custom-bucket'
    );
    expect(json.multipart.files[0].parts[0].signedUrl).not.toContain(
      'my-default-bucket'
    );

    json.multipart.files[0].parts.forEach((part: any) => {
      part.signedUrl = 'signed-url-placeholder';
    });
    json.multipart.files[0].completeSignedUrl =
      'complete-signed-url-placeholder';
    json.multipart.files[0].abortSignedUrl = 'abort-signed-url-placeholder';
    expect(json).toMatchSnapshot();
  });

  it('should accept valid single file upload request', async () => {
    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'singleImage',
          files: [{ name: 'file1.jpg', size: 500000, type: 'image/jpeg' }],
        }),
      }),
      router
    );
    const json = await res.json();

    expect(res.status).toBe(200);

    json.multipart.files[0].parts.forEach((part: any) => {
      part.signedUrl = 'signed-url-placeholder';
    });
    json.multipart.files[0].completeSignedUrl =
      'complete-signed-url-placeholder';
    json.multipart.files[0].abortSignedUrl = 'abort-signed-url-placeholder';
    expect(json).toMatchSnapshot();
  });

  it('should accept valid multiple files upload request', async () => {
    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'multipleImages',
          files: [
            { name: 'file1.jpg', size: 500000, type: 'image/jpeg' },
            { name: 'file2.png', size: 400000, type: 'image/png' },
          ],
        }),
      }),
      router
    );
    const json = await res.json();

    expect(res.status).toBe(200);

    json.multipart.files.forEach((file: any) => {
      file.parts.forEach((part: any) => {
        part.signedUrl = 'signed-url-placeholder';
      });
      file.completeSignedUrl = 'complete-signed-url-placeholder';
      file.abortSignedUrl = 'abort-signed-url-placeholder';
    });
    expect(json).toMatchSnapshot();
  });
});

describe('multipart resume', () => {
  const partSize = 1024 * 1024 * 50; // 50MB, matches default
  const fileSize = partSize * 4; // 4 parts total

  const { router } = createTestRouter({
    routes: {
      videos: route({
        multipart: true,
        maxFileSize: fileSize * 2,
        onBeforeUpload({ file }) {
          return {
            objectInfo: { key: `videos/${file.name}` },
          };
        },
      }),
    },
  });

  beforeEach(() => {
    vi.mocked(createMultipartUpload).mockClear();
    vi.mocked(listParts).mockReset();
    vi.mocked(listParts).mockResolvedValue({
      bucket: 'my-default-bucket',
      key: 'videos/file.mp4',
      uploadId: 'existing-upload-id',
      partNumberMarker: undefined,
      nextPartNumberMarker: undefined,
      maxParts: 1000,
      isTruncated: false,
      parts: [],
    });
  });

  it('reuses uploadId and key from request, skips createMultipartUpload', async () => {
    vi.mocked(listParts).mockResolvedValueOnce({
      bucket: 'my-default-bucket',
      key: 'videos/file.mp4',
      uploadId: 'existing-upload-id',
      partNumberMarker: undefined,
      nextPartNumberMarker: undefined,
      maxParts: 1000,
      isTruncated: false,
      parts: [
        {
          partNumber: 1,
          eTag: '"etag-1"',
          size: partSize,
          lastModified: new Date(),
        },
        {
          partNumber: 2,
          eTag: '"etag-2"',
          size: partSize,
          lastModified: new Date(),
        },
      ],
    });

    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'videos',
          files: [
            {
              name: 'file.mp4',
              size: fileSize,
              type: 'video/mp4',
              resume: {
                uploadId: 'existing-upload-id',
                key: 'videos/file.mp4',
              },
            },
          ],
        }),
      }),
      router
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(createMultipartUpload).not.toHaveBeenCalled();
    expect(listParts).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        uploadId: 'existing-upload-id',
        key: 'videos/file.mp4',
      })
    );

    const file = json.multipart.files[0];
    expect(file.uploadId).toBe('existing-upload-id');
    expect(file.file.objectInfo.key).toBe('videos/file.mp4');
    expect(file.parts.map((p: any) => p.partNumber)).toEqual([3, 4]);
    expect(file.completedParts).toEqual([
      { partNumber: 1, eTag: '"etag-1"', size: partSize },
      { partNumber: 2, eTag: '"etag-2"', size: partSize },
    ]);
  });

  it('non-resume request still calls createMultipartUpload, omits completedParts work', async () => {
    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'videos',
          files: [{ name: 'fresh.mp4', size: fileSize, type: 'video/mp4' }],
        }),
      }),
      router
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(createMultipartUpload).toHaveBeenCalledOnce();
    expect(listParts).not.toHaveBeenCalled();

    const file = json.multipart.files[0];
    expect(file.uploadId).toBe('mock-upload-id');
    expect(file.parts.map((p: any) => p.partNumber)).toEqual([1, 2, 3, 4]);
    expect(file.completedParts).toBeUndefined();
  });

  it('falls back to a fresh upload when listParts returns NoSuchUpload', async () => {
    vi.mocked(listParts).mockRejectedValueOnce(
      new S3Error('NoSuchUpload - The specified upload does not exist.')
    );

    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'videos',
          files: [
            {
              name: 'file.mp4',
              size: fileSize,
              type: 'video/mp4',
              resume: {
                uploadId: 'expired-upload-id',
                key: 'videos/file.mp4',
              },
            },
          ],
        }),
      }),
      router
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(createMultipartUpload).toHaveBeenCalledOnce();

    const file = json.multipart.files[0];
    expect(file.uploadId).toBe('mock-upload-id');
    expect(file.file.objectInfo.key).toBe('videos/file.mp4');
    expect(file.parts.map((p: any) => p.partNumber)).toEqual([1, 2, 3, 4]);
    expect(file.completedParts).toBeUndefined();
  });

  it('rethrows non-NoSuchUpload S3 errors from listParts', async () => {
    vi.mocked(listParts).mockRejectedValueOnce(
      new S3Error('AccessDenied - Permission denied.')
    );

    await expect(
      handleRequest(
        routerRequest({
          method: 'POST',
          body: routerUploadBody({
            route: 'videos',
            files: [
              {
                name: 'file.mp4',
                size: fileSize,
                type: 'video/mp4',
                resume: {
                  uploadId: 'some-upload-id',
                  key: 'videos/file.mp4',
                },
              },
            ],
          }),
        }),
        router
      )
    ).rejects.toThrow('AccessDenied');
  });

  it('paginates listParts when isTruncated', async () => {
    vi.mocked(listParts)
      .mockResolvedValueOnce({
        bucket: 'my-default-bucket',
        key: 'videos/file.mp4',
        uploadId: 'existing-upload-id',
        partNumberMarker: undefined,
        nextPartNumberMarker: 1,
        maxParts: 1,
        isTruncated: true,
        parts: [
          {
            partNumber: 1,
            eTag: '"etag-1"',
            size: partSize,
            lastModified: new Date(),
          },
        ],
      })
      .mockResolvedValueOnce({
        bucket: 'my-default-bucket',
        key: 'videos/file.mp4',
        uploadId: 'existing-upload-id',
        partNumberMarker: 1,
        nextPartNumberMarker: undefined,
        maxParts: 1,
        isTruncated: false,
        parts: [
          {
            partNumber: 2,
            eTag: '"etag-2"',
            size: partSize,
            lastModified: new Date(),
          },
        ],
      });

    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'videos',
          files: [
            {
              name: 'file.mp4',
              size: fileSize,
              type: 'video/mp4',
              resume: {
                uploadId: 'existing-upload-id',
                key: 'videos/file.mp4',
              },
            },
          ],
        }),
      }),
      router
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(listParts).toHaveBeenCalledTimes(2);

    const file = json.multipart.files[0];
    expect(file.parts.map((p: any) => p.partNumber)).toEqual([3, 4]);
    expect(file.completedParts.map((p: any) => p.partNumber)).toEqual([1, 2]);
  });
});
