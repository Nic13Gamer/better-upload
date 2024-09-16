import { r2 } from '@/lib/r2';
import { createUploadRouteHandler, route } from 'next-upload/server';

export const { POST } = createUploadRouteHandler({
  client: r2,
  bucketName: process.env.AWS_BUCKET_NAME!,
  routes: {
    image: route({
      fileTypes: ['image/*'],
      maxFileSize: 1024 * 1024 * 2, // 2MB
    }),
    images: route({
      fileTypes: ['image/*'],
      multipleFiles: true,
      maxFiles: 4,
      onBeforeUpload() {
        const uploadId = crypto.randomUUID();
        console.log('Before upload:', uploadId);

        return {
          generateObjectKey({ file }) {
            console.log('Generate object key:', file.name);

            return `multiple/${uploadId}/${file.name}`;
          },
        };
      },
    }),
  },
});
