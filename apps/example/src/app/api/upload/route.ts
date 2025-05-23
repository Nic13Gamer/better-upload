import { createUploadRouteHandler, route } from 'better-upload/server';
import { r2 } from 'better-upload/server/helpers';

export const { POST } = createUploadRouteHandler({
  client: r2(),
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
    multipart: route({
      multipart: true,
      multipleFiles: true,
      maxFiles: 5,
      partSize: 1024 * 1024 * 5, // 5MB
      maxFileSize: 1024 * 1024 * 80, // 80MB
    }),
    form: route({
      multipleFiles: true,
      maxFiles: 5,
      onBeforeUpload() {
        return {
          generateObjectKey: () => `form/${crypto.randomUUID()}`,
        };
      },
    }),
  },
});
