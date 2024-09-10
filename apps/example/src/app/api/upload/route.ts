import { r2 } from '@/lib/r2';
import { createUploadRouteHandler, route } from 'next-upload/server';

export const { POST } = createUploadRouteHandler({
  client: r2,
  bucketName: process.env.AWS_BUCKET_NAME!,
  routes: {
    image: route({
      fileTypes: ['image/*'],
    }),
    images: route({
      fileTypes: ['image/*'],
      multipleFiles: true,
      maxFiles: 2,
      onBeforeUpload() {
        const uploadId = crypto.randomUUID();
        console.log('Before upload', uploadId);

        return {
          generateBucketKey({ file }) {
            console.log('Generate bucket key', file.name);

            return `multiple/${uploadId}/${file.name}`;
          },
        };
      },
    }),
  },
});
