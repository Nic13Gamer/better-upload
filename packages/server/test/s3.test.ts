import { handleRequest, route } from '@/router';
import { describe, expect, it, test } from 'vitest';
import {
  createTestRouter,
  routerRequest,
  routerUploadBody,
} from './utils/router';
import { verifySignedUrl } from './utils/s3';

describe('files handler signed URL validation', () => {
  const { router, secretAccessKey } = createTestRouter({
    routes: {
      singleImage: route({
        maxFileSize: 1024 * 1024 * 5, // 5MB
        fileTypes: ['image/*'],
        onBeforeUpload({ file }) {
          return {
            objectInfo: { key: `single/${file.name}` },
          };
        },
      }),
      withAcl: route({
        onBeforeUpload() {
          return {
            objectInfo: { acl: 'public-read' },
          };
        },
      }),
      withStorageClass: route({
        onBeforeUpload() {
          return {
            objectInfo: { storageClass: 'GLACIER' },
          };
        },
      }),
      withMetadata: route({
        onBeforeUpload() {
          return {
            objectInfo: { metadata: { custom_meta: 'custom_value' } },
          };
        },
      }),
      withCacheControl: route({
        onBeforeUpload() {
          return {
            objectInfo: { cacheControl: 'max-age=3600' },
          };
        },
      }),
    },
  });

  test('valid signed URL', async () => {
    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'singleImage',
          files: [{ name: 'file.jpg', size: 5000, type: 'image/jpeg' }],
        }),
      }),
      router
    );
    const json = await res.json();
    const url = json.files[0].signedUrl;

    expect(res.status).toBe(200);

    expect(
      await verifySignedUrl(url, {
        secretAccessKey,
        method: 'PUT',
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Length': '5000',
        },
      })
    ).toBe(true);
  });

  it('should reject signed URL with invalid content-length', async () => {
    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'singleImage',
          files: [{ name: 'file.png', size: 300000, type: 'image/png' }],
        }),
      }),
      router
    );
    const json = await res.json();
    const url = json.files[0].signedUrl;

    expect(res.status).toBe(200);

    expect(
      await verifySignedUrl(url, {
        secretAccessKey,
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': '200000', // incorrect content length
        },
      })
    ).toBe(false);
  });

  it('should reject signed URL with invalid content-type', async () => {
    const res = await handleRequest(
      routerRequest({
        method: 'POST',
        body: routerUploadBody({
          route: 'singleImage',
          files: [{ name: 'file.png', size: 300000, type: 'image/png' }],
        }),
      }),
      router
    );
    const json = await res.json();
    const url = json.files[0].signedUrl;

    expect(res.status).toBe(200);

    expect(
      await verifySignedUrl(url, {
        secretAccessKey,
        method: 'PUT',
        headers: {
          'Content-Type': 'image/jpeg', // incorrect content type
          'Content-Length': '200000',
        },
      })
    ).toBe(false);
  });

  describe('with ACL', () => {
    it('should generate valid signed URL when ACL is set', async () => {
      const res = await handleRequest(
        routerRequest({
          method: 'POST',
          body: routerUploadBody({
            route: 'withAcl',
            files: [{ name: 'file.txt', size: 1000, type: 'text/plain' }],
          }),
        }),
        router
      );
      const json = await res.json();
      const url = json.files[0].signedUrl;

      expect(res.status).toBe(200);

      expect(
        await verifySignedUrl(url, {
          secretAccessKey,
          method: 'PUT',
          headers: {
            'Content-Type': 'text/plain',
            'Content-Length': '1000',
          },
        })
      ).toBe(true);
    });

    it('should reject signed URL with incorrect ACL', async () => {
      const res = await handleRequest(
        routerRequest({
          method: 'POST',
          body: routerUploadBody({
            route: 'withAcl',
            files: [{ name: 'file.txt', size: 1000, type: 'text/plain' }],
          }),
        }),
        router
      );
      const json = await res.json();
      const url = new URL(json.files[0].signedUrl);
      url.searchParams.set('x-amz-acl', 'private'); // modify ACL to incorrect value

      expect(res.status).toBe(200);

      expect(
        await verifySignedUrl(url.toString(), {
          secretAccessKey,
          method: 'PUT',
          headers: {
            'Content-Type': 'text/plain',
            'Content-Length': '1000',
          },
        })
      ).toBe(false);
    });
  });

  describe('with Storage Class', () => {
    it('should generate valid signed URL when Storage Class is set', async () => {
      const res = await handleRequest(
        routerRequest({
          method: 'POST',
          body: routerUploadBody({
            route: 'withStorageClass',
            files: [{ name: 'file.txt', size: 1000, type: 'text/plain' }],
          }),
        }),
        router
      );
      const json = await res.json();
      const url = json.files[0].signedUrl;

      expect(res.status).toBe(200);

      expect(
        await verifySignedUrl(url, {
          secretAccessKey,
          method: 'PUT',
          headers: {
            'Content-Type': 'text/plain',
            'Content-Length': '1000',
          },
        })
      ).toBe(true);
    });

    it('should reject signed URL with incorrect Storage Class', async () => {
      const res = await handleRequest(
        routerRequest({
          method: 'POST',
          body: routerUploadBody({
            route: 'withStorageClass',
            files: [{ name: 'file.txt', size: 1000, type: 'text/plain' }],
          }),
        }),
        router
      );
      const json = await res.json();
      const url = new URL(json.files[0].signedUrl);
      url.searchParams.set('x-amz-storage-class', 'STANDARD'); // modify Storage Class to incorrect value

      expect(res.status).toBe(200);

      expect(
        await verifySignedUrl(url.toString(), {
          secretAccessKey,
          method: 'PUT',
          headers: {
            'Content-Type': 'text/plain',
            'Content-Length': '1000',
          },
        })
      ).toBe(false);
    });
  });

  describe('with Metadata', () => {
    it('should generate valid signed URL when Metadata is set', async () => {
      const res = await handleRequest(
        routerRequest({
          method: 'POST',
          body: routerUploadBody({
            route: 'withMetadata',
            files: [{ name: 'file.txt', size: 1000, type: 'text/plain' }],
          }),
        }),
        router
      );
      const json = await res.json();
      const url = json.files[0].signedUrl;

      expect(res.status).toBe(200);

      const valid = await verifySignedUrl(url, {
        secretAccessKey,
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': '1000',
          'x-amz-meta-custom_meta': 'custom_value',
        },
      });
      expect(valid).toBe(true);
    });

    it('should reject signed URL with invalid Metadata', async () => {
      const res = await handleRequest(
        routerRequest({
          method: 'POST',
          body: routerUploadBody({
            route: 'withMetadata',
            files: [{ name: 'file.txt', size: 1000, type: 'text/plain' }],
          }),
        }),
        router
      );
      const json = await res.json();
      const url = json.files[0].signedUrl;

      expect(res.status).toBe(200);

      expect(
        await verifySignedUrl(url, {
          secretAccessKey,
          method: 'PUT',
          headers: {
            'Content-Type': 'text/plain',
            'Content-Length': '1000',
            'x-amz-meta-custom_meta': 'wrong_value', // incorrect metadata value
          },
        })
      ).toBe(false);
      expect(
        await verifySignedUrl(url, {
          secretAccessKey,
          method: 'PUT',
          headers: {
            'Content-Type': 'text/plain',
            'Content-Length': '1000',
            'x-amz-meta-other_meta': 'value', // incorrect metadata key
          },
        })
      ).toBe(false);
      expect(
        await verifySignedUrl(url, {
          secretAccessKey,
          method: 'PUT',
          headers: {
            'Content-Type': 'text/plain',
            'Content-Length': '1000',
            // missing metadata
          },
        })
      ).toBe(false);
    });
  });

  describe('with Cache Control', () => {
    it('should generate valid signed URL when Cache Control is set', async () => {
      const res = await handleRequest(
        routerRequest({
          method: 'POST',
          body: routerUploadBody({
            route: 'withCacheControl',
            files: [{ name: 'file.txt', size: 1000, type: 'text/plain' }],
          }),
        }),
        router
      );
      const json = await res.json();
      const url = json.files[0].signedUrl;

      expect(res.status).toBe(200);

      const valid = await verifySignedUrl(url, {
        secretAccessKey,
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': '1000',
          'Cache-Control': 'max-age=3600',
        },
      });
      expect(valid).toBe(true);
    });

    it('should reject signed URL with invalid Cache Control', async () => {
      const res = await handleRequest(
        routerRequest({
          method: 'POST',
          body: routerUploadBody({
            route: 'withCacheControl',
            files: [{ name: 'file.txt', size: 1000, type: 'text/plain' }],
          }),
        }),
        router
      );
      const json = await res.json();
      const url = json.files[0].signedUrl;

      expect(res.status).toBe(200);

      expect(
        await verifySignedUrl(url, {
          secretAccessKey,
          method: 'PUT',
          headers: {
            'Content-Type': 'text/plain',
            'Content-Length': '1000',
            'Cache-Control': 'max-age=7200', // incorrect cache control
          },
        })
      ).toBe(false);
      expect(
        await verifySignedUrl(url, {
          secretAccessKey,
          method: 'PUT',
          headers: {
            'Content-Type': 'text/plain',
            'Content-Length': '1000',
            // missing cache control
          },
        })
      ).toBe(false);
    });
  });
});
