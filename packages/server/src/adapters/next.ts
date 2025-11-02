import { handleRequest } from '@/router';
import type { Router } from '@/types';

/**
 * @example
 *
 * ```ts
 * // app/api/upload/route.ts
 * export const { POST } = toRouteHandler(router);
 * ```
 */
export function toRouteHandler(router: Router) {
  return {
    POST: (req: Request) => handleRequest(req, router),
  };
}
