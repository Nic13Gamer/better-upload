import { handleRequest } from '@/router';
import type { Router } from '@/types';

export function toRouteHandler(router: Router) {
  return {
    POST: (req: Request) => handleRequest(req, router),
  };
}
