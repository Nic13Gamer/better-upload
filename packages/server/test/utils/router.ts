import { aws } from '@/clients';
import type { Router } from '@/types';
import type { UploadFileSchema } from '@/validations';
import { generateMockCredentials } from './s3';

export const createTestRouter = ({ routes }: { routes: Router['routes'] }) => {
  const credentials = generateMockCredentials();

  return {
    router: {
      client: aws({
        region: 'us-east-1',
        ...credentials,
      }),
      bucketName: 'my-default-bucket',
      routes,
    } as Router,
    ...credentials,
  };
};

export const routerRequest = (opts: RequestInit) =>
  new Request('http://localhost:3000/api/upload', opts);

export const routerUploadBody = (body: UploadFileSchema) =>
  JSON.stringify(body);
