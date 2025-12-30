import { route, Router } from '@better-upload/server';
import { toRouteHandler } from '@better-upload/server/adapters/next';
import { linode } from '@better-upload/server/clients';
const validateConfig = () =>{
  
  return {
    accessKey: process.env.AWS_ACCESS_KEY_ID,
    region: process.env.AWS_REGION,
    secretKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
}

const router: Router = {
  client: linode(validateConfig()),
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
          generateObjectInfo({ file }) {
            console.log('Generate object info:', file.name);

            return {
              key: `multiple/${uploadId}/${file.name}`,
            };
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
          generateObjectInfo: () => ({ key: `form/${crypto.randomUUID()}` }),
        };
      },
    }),
  },
};

export const { POST } = toRouteHandler(router);
