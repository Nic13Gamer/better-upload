import type { Router } from '@/types/router/public';
import { clientRequestSchema } from '@/validations';
import type { UploadRequestErrorResponse } from '@repo/shared/types/router';
import { handleUploadRequest } from './handlers/upload-handler';

/**
 * Handle a request to a Better Upload router.
 */
export async function handleRequest(req: Request, router: Router) {
  if (req.method !== 'POST') {
    return Response.json(
      {
        error: {
          type: 'invalid_request',
          message: 'Method not allowed.',
        },
      } satisfies UploadRequestErrorResponse,
      { status: 405 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch (error) {
    return Response.json(
      {
        error: {
          type: 'invalid_request',
          message: 'Invalid JSON body.',
        },
      } satisfies UploadRequestErrorResponse,
      { status: 400 }
    );
  }

  const parsed = clientRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: {
          type: 'invalid_request',
          message: 'Invalid request body schema.',
        },
      } satisfies UploadRequestErrorResponse,
      { status: 400 }
    );
  }

  if ('upload' in parsed.data) {
    return handleUploadRequest({ req, router, uploadData: parsed.data.upload });
  }

  throw new Error('Unreachable Better Upload code.');
}
