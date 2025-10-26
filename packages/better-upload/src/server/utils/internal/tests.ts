import { RejectUpload } from '@/server/error';
import type { Router } from '@/server/types/public';
import type { UploadFileSchema } from '@/server/validations';
import { S3Client } from '@aws-sdk/client-s3';
import { z } from 'zod/mini';
import { route } from '../router';

export const testRouter: Router = {
  client: new S3Client({
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  }),
  bucketName: 'example-bucket',
  routes: {
    multipleImages: route({
      multipleFiles: true,
      maxFiles: 3,
      maxFileSize: 1024 * 1024 * 5, // 5MB
      fileTypes: ['image/*'],
      onBeforeUpload() {
        return {
          generateObjectInfo: ({ file }) => ({ key: `multiple/${file.name}` }),
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
    withMetaSchema: route({
      clientMetadataSchema: z.object({
        name: z.string(),
      }),
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
};

export const testRequest = (opts: RequestInit) =>
  new Request('http://localhost:3000/api/upload', opts);

export const uploadBody = (body: UploadFileSchema) => JSON.stringify(body);
