import type { Router } from '@/server/types/public';
import { uploadFileSchema } from '@/server/validations';
import { NextRequest, NextResponse } from 'next/server';
import { handleFile } from './handlers/file-handler';
import { handleMultipleFiles } from './handlers/multiple-files-handler';

export function createUploadRouteHandler(router: Router) {
  return {
    POST: async (req: NextRequest) => {
      let body;
      try {
        body = await req.json();
      } catch (error) {
        return NextResponse.json(
          { error: { message: 'Invalid JSON body.' } },
          { status: 400 }
        );
      }

      const parsed = uploadFileSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: { message: 'Invalid file upload schema.' } },
          { status: 400 }
        );
      }

      const { data } = parsed;

      if (!(data.route in router.routes)) {
        return NextResponse.json(
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
        return NextResponse.json(
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