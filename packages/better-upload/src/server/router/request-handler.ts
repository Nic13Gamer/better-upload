import type { Router } from '../types/public';
import { uploadFileSchema } from '../validations';
import { handleFiles } from './handlers/files-handler';
import { handleMultipartFiles } from './handlers/multipart-handler';

export async function handleRequest(req: Request, router: Router) {
  if (req.method !== 'POST') {
    return Response.json(
      {
        error: {
          type: 'invalid_request',
          message: 'Method not allowed.',
        },
      },
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
      },
      { status: 400 }
    );
  }

  const parsed = uploadFileSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: {
          type: 'invalid_request',
          message: 'Invalid file upload schema.',
        },
      },
      { status: 400 }
    );
  }

  const { data } = parsed;

  if (!(data.route in router.routes)) {
    return Response.json(
      {
        error: {
          type: 'invalid_request',
          message: 'Upload route not found.',
        },
      },
      { status: 404 }
    );
  }

  const route = router.routes[data.route]!();

  if (route.maxFiles === 1 && data.files.length > 1) {
    return Response.json(
      {
        error: {
          type: 'too_many_files',
          message: 'Multiple files are not allowed.',
        },
      },
      { status: 400 }
    );
  }

  const hasMultipartHeader = req.headers.get('x-multipart-upload') === 'true';

  if (route.multipart && hasMultipartHeader) {
    return handleMultipartFiles({
      req,
      client: router.client,
      bucketName: router.bucketName,
      route,
      data,
    });
  } else if (route.multipart && !hasMultipartHeader) {
    return Response.json(
      {
        error: {
          type: 'invalid_request',
          message: 'This upload route is configured for multipart uploads.',
        },
      },
      { status: 400 }
    );
  } else if (!route.multipart && hasMultipartHeader) {
    return Response.json(
      {
        error: {
          type: 'invalid_request',
          message: 'This upload route is not configured for multipart uploads.',
        },
      },
      { status: 400 }
    );
  }

  return handleFiles({
    req,
    client: router.client,
    bucketName: router.bucketName,
    route,
    data,
  });
}
