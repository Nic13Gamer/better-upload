import { aws } from '@/clients';
import type { Router } from '@/types';
import type { UploadFileSchema } from '@/validations';

export const createTestRouter = ({
  routes,
}: {
  routes: Router['routes'];
}): Router => ({
  client: aws({
    region: 'us-east-1',
    accessKeyId: 'test',
    secretAccessKey: 'test',
  }),
  bucketName: 'my-default-bucket',
  routes,
});

export const routerRequest = (opts: RequestInit) =>
  new Request('http://localhost:3000/api/upload', opts);

export const routerUploadBody = (body: UploadFileSchema) =>
  JSON.stringify(body);
