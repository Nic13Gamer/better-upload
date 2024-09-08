import { r2 } from '@/lib/r2';
import { createUploadRouteHandler, route } from 'next-upload/server';

export const { POST } = createUploadRouteHandler({
  client: r2,
  bucketName: process.env.AWS_BUCKET_NAME!,
  routes: {
    image: route({
      fileTypes: ['image/*'],
    }),
  },
});
