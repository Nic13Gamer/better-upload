import { describe, expect, it, vi } from 'vitest';
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

import { handleRequest, RejectUpload, route } from '@/router';

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

describe('uploadMethod handler', () => {
  const { router } = createTestRouter({
    routes: {
      singleImagePost: route({
        uploadMethod: 'post',
        maxFileSize: 1024 * 1024 * 5, // 5MB
        fileTypes: ['image/*'],
        onBeforeUpload({ file }) {
          return {
            objectInfo: { key: `single-post/${file.name}` },
          };
        },
      }),
      multipleImagesPost: route({
        uploadMethod: 'post',
        multipleFiles: true,
        maxFiles: 3,
        maxFileSize: 1024 * 1024 * 5, // 5MB
        fileTypes: ['image/*'],
        onBeforeUpload() {
          return {
            generateObjectInfo: ({ file }) => ({
              key: `multiple-post/${file.name}`,
            }),
          };
        },
      }),
      singleImagePut: route({
        uploadMethod: 'put',
        maxFileSize: 1024 * 1024 * 5, // 5MB
        fileTypes: ['image/*'],
        onBeforeUpload({ file }) {
          return {
            objectInfo: { key: `single-put/${file.name}` },
          };
        },
      }),
      defaultMethod: route({
        // No uploadMethod specified - should default to 'put'
        maxFileSize: 1024 * 1024 * 5, // 5MB
        fileTypes: ['image/*'],
        onBeforeUpload({ file }) {
          return {
            objectInfo: { key: `default/${file.name}` },
          };
        },
      }),
      customBucketPost: route({
        uploadMethod: 'post',
        onBeforeUpload({ file }) {
          return {
            bucketName: 'my-custom-bucket',
            objectInfo: { key: `custom-post/${file.name}` },
          };
        },
      }),
    },
  });

  it('should accept valid single file upload request with POST method', async () => {
    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'singleImagePost',
          files: [{ name: 'file1.jpg', size: 500000, type: 'image/jpeg' }],
        }),
      }),
      router
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.method).toBe('post');
    expect(json.files[0].postForm).toBeDefined();
    expect(json.files[0].signedUrl).toBeUndefined();

    // Replace dynamic values for snapshot
    if (json.files[0].postForm) {
      json.files[0].postForm = 'post-form-placeholder';
    }
    expect(json).toMatchSnapshot();
  });

  it('should accept valid multiple files upload request with POST method', async () => {
    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'multipleImagesPost',
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
    expect(json.method).toBe('post');
    expect(json.files).toHaveLength(2);
    json.files.forEach((file: any) => {
      expect(file.postForm).toBeDefined();
      expect(file.signedUrl).toBeUndefined();
    });

    // Replace dynamic values for snapshot
    json.files.forEach((file: any) => {
      if (file.postForm) {
        file.postForm = 'post-form-placeholder';
      }
    });
    expect(json).toMatchSnapshot();
  });

  it('should accept valid single file upload request with PUT method', async () => {
    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'singleImagePut',
          files: [{ name: 'file1.jpg', size: 500000, type: 'image/jpeg' }],
        }),
      }),
      router
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.method).toBe('put');
    expect(json.files[0].signedUrl).toBeDefined();
    expect(json.files[0].postForm).toBeUndefined();

    json.files[0].signedUrl = 'signed-url-placeholder';
    expect(json).toMatchSnapshot();
  });

  it('should default to PUT method when uploadMethod is not specified', async () => {
    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'defaultMethod',
          files: [{ name: 'file1.jpg', size: 500000, type: 'image/jpeg' }],
        }),
      }),
      router
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.method).toBe('put');
    expect(json.files[0].signedUrl).toBeDefined();
    expect(json.files[0].postForm).toBeUndefined();

    json.files[0].signedUrl = 'signed-url-placeholder';
    expect(json).toMatchSnapshot();
  });

  it('should accept valid upload with custom bucket using POST method', async () => {
    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'customBucketPost',
          files: [{ name: 'file1.jpg', size: 500000, type: 'image/jpeg' }],
        }),
      }),
      router
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.method).toBe('post');
    expect(json.files[0].postForm).toBeDefined();
    // The postForm should contain references to the custom bucket
    expect(JSON.stringify(json.files[0].postForm)).toContain(
      'my-custom-bucket'
    );
    expect(JSON.stringify(json.files[0].postForm)).not.toContain(
      'my-default-bucket'
    );

    json.files[0].postForm = 'post-form-placeholder';
    expect(json).toMatchSnapshot();
  });

  it('should reject file too large with POST method', async () => {
    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'singleImagePost',
          files: [
            { name: 'file1.jpg', size: 1024 * 1024 * 10, type: 'image/jpeg' }, // 10MB > 5MB limit
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

  it('should reject invalid file type with POST method', async () => {
    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'singleImagePost',
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

  it('should reject too many files with POST method', async () => {
    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'multipleImagesPost',
          files: [
            { name: 'file1.jpg', size: 500000, type: 'image/jpeg' },
            { name: 'file2.jpg', size: 400000, type: 'image/jpeg' },
            { name: 'file3.jpg', size: 300000, type: 'image/jpeg' },
            { name: 'file4.jpg', size: 200000, type: 'image/jpeg' }, // 4 files > 3 max
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
