import type { Router } from '@/server/types/public';
import { handleRequest } from '../request-handler';

export function createUploadRouteHandler(router: Router) {
  return {
    POST: (req: Request) => handleRequest(req, router),
  };
}
