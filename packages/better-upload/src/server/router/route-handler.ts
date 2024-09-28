import type { Router } from '@/server/types/public';
import { uploadFileSchema } from '@/server/validations';
import { handleFile } from './handlers/file-handler';
import { handleMultipleFiles } from './handlers/multiple-files-handler';

export function createUploadRouteHandler(router: Router) {
  return {
    POST: async (req: Request) => {
      let body;
      try {
        body = await req.json();
      } catch (error) {
        return Response.json(
          { error: { message: 'Invalid JSON body.' } },
          { status: 400 }
        );
      }

      const parsed = uploadFileSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: { message: 'Invalid file upload schema.' } },
          { status: 400 }
        );
      }

      const { data } = parsed;

      if (!(data.route in router.routes)) {
        return Response.json(
          { error: { message: 'Upload route not found.' } },
          { status: 404 }
        );
      }

      const route = router.routes[data.route]!();

      if (route.multipleFiles) {
        return handleMultipleFiles({
          req,
          client: router.client,
          bucketName: router.bucketName,
          route,
          data,
        });
      } else if (data.files.length > 1) {
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

      return handleFile({
        req,
        client: router.client,
        bucketName: router.bucketName,
        route,
        data,
      });
    },
  };
}
