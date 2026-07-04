import { config } from '@/config';
import { presignAbortMultipartUpload } from '@/helpers/s3/abort-multipart-upload';
import { presignCompleteMultipartUpload } from '@/helpers/s3/complete-multipart-upload';
import { createMultipartUpload } from '@/helpers/s3/create-multipart-upload';
import { presignPutObject } from '@/helpers/s3/put-object';
import { presignUploadPart } from '@/helpers/s3/upload-part';
import type { Router } from '@/types';
import type { FileInfo } from '@/types/router/internal';
import { isFileTypeAllowed } from '@/utils/file-type';
import { createSlug } from '@/utils/slug';
import { standardValidate } from '@/utils/standard-schema';
import type { ClientRequestSchema } from '@/validations';
import type {
  UploadRequestErrorResponse,
  UploadRequestSuccessResponse,
} from '@repo/shared/types/router';
import { RejectUpload } from '../route';

export async function handleUploadRequest({
  req,
  router,
  uploadData,
}: {
  req: Request;
  router: Router;
  uploadData: ClientRequestSchema['upload'];
}) {
  if (!(uploadData.route in router.routes)) {
    return Response.json(
      {
        error: {
          type: 'invalid_request',
          message: 'Upload route not found.',
        },
      } satisfies UploadRequestErrorResponse,
      { status: 404 }
    );
  }

  const route = router.routes[uploadData.route]!();

  if (route.maxFiles === 1 && uploadData.files.length > 1) {
    return Response.json(
      {
        error: {
          type: 'too_many_files',
          message: 'Multiple files are not allowed.',
        },
      } satisfies UploadRequestErrorResponse,
      { status: 400 }
    );
  }

  let clientMetadata = uploadData.metadata;
  if (route.clientMetadataSchema) {
    const validation = await standardValidate(
      route.clientMetadataSchema,
      clientMetadata
    );

    if (validation.issues) {
      return Response.json(
        {
          error: {
            type: 'invalid_request',
            message: 'Invalid metadata.',
          },
        } satisfies UploadRequestErrorResponse,
        { status: 400 }
      );
    }

    clientMetadata = validation.value;
  }

  const { files } = uploadData;
  const maxFiles = route.maxFiles || config.defaultMaxFiles;
  const maxFileSize = route.maxFileSize || config.defaultMaxFileSize;
  const partSize = route.multipart?.partSize || config.defaultMultipartPartSize;

  if (files.length > maxFiles) {
    return Response.json(
      {
        error: {
          type: 'too_many_files',
          message: 'Too many files.',
        },
      } satisfies UploadRequestErrorResponse,
      { status: 400 }
    );
  }

  for (const file of files) {
    if (files.filter((f) => f._id === file._id).length > 1) {
      return Response.json(
        {
          error: {
            type: 'invalid_request',
            message: 'Duplicate file IDs are not allowed.',
          },
        } satisfies UploadRequestErrorResponse,
        { status: 400 }
      );
    }

    if (!route.multipart && file.size > 1024 * 1024 * 5000) {
      return Response.json(
        {
          error: {
            type: 'file_too_large',
            message:
              'One or more files exceed the S3 limit of 5GB. Use multipart upload for larger files.',
          },
        } satisfies UploadRequestErrorResponse,
        { status: 400 }
      );
    } else if (route.multipart && Math.ceil(file.size / partSize) > 10000) {
      return Response.json(
        {
          error: {
            type: 'file_too_large',
            message: `One or more files are too large, exceeding the S3 maximum limit of 10,000 parts.`,
          },
        } satisfies UploadRequestErrorResponse,
        { status: 400 }
      );
    }

    if (file.size > maxFileSize) {
      return Response.json(
        {
          error: {
            type: 'file_too_large',
            message: 'One or more files are too large.',
          },
        } satisfies UploadRequestErrorResponse,
        { status: 400 }
      );
    }

    if (
      route.fileTypes &&
      route.fileTypes.length > 0 &&
      !isFileTypeAllowed(file.type, route.fileTypes)
    ) {
      return Response.json(
        {
          error: {
            type: 'invalid_file_type',
            message: 'One or more files have an invalid file type.',
          },
        } satisfies UploadRequestErrorResponse,
        { status: 400 }
      );
    }
  }

  let interMetadata, bucketName, generateObjectInfoCallback;
  try {
    const onBeforeUploadResult = await route.onBeforeUpload?.({
      req,
      clientMetadata,
      files,
    });

    interMetadata = onBeforeUploadResult?.metadata || {};
    bucketName = onBeforeUploadResult?.bucketName || router.bucketName;
    generateObjectInfoCallback =
      onBeforeUploadResult?.generateObjectInfo || null;
  } catch (error) {
    if (error instanceof RejectUpload) {
      return Response.json(
        {
          error: { type: 'rejected', message: error.message },
        } satisfies UploadRequestErrorResponse,
        { status: 400 }
      );
    }

    throw error;
  }

  const signedUrls = (
    await Promise.all(
      files.map(async (file) => {
        let objectInfo: FileInfo<true>['objectInfo'] = {
          key: `${crypto.randomUUID()}_${createSlug(file.name)}`,
          metadata: {},
          acl: undefined,
          storageClass: undefined,
          cacheControl: undefined,
          tagging: undefined,
        };

        if (generateObjectInfoCallback) {
          const { skip, ...result } = await generateObjectInfoCallback({
            file,
          });

          objectInfo = {
            ...result,
            key: result.key || objectInfo.key,
            metadata: result.metadata
              ? Object.fromEntries(
                  Object.entries(result.metadata).map(([key, value]) => [
                    key.toLowerCase(),
                    value,
                  ])
                )
              : objectInfo.metadata,
          };

          if (skip === 'ignore') {
            return null;
          } else if (skip === 'completed') {
            return {
              file: { ...file, objectInfo },
              skip: 'completed' as const,
            };
          }
        }

        if (!route.multipart) {
          const { url: signedUrl, headers } = await presignPutObject(
            router.client,
            {
              bucket: bucketName,
              contentType: file.type,
              contentLength: file.size,
              expiresIn:
                route.signedUrlExpiresIn || config.defaultSignedUrlExpiresIn,
              ...objectInfo,
            }
          );

          return {
            file: { ...file, objectInfo },
            signedUrl,
            headers: Object.fromEntries(
              Object.entries(headers).filter(
                ([key]) =>
                  !['content-type', 'content-length'].includes(
                    key.toLowerCase()
                  )
              )
            ),
          };
        }

        const { uploadId: multipartUploadId } = await createMultipartUpload(
          router.client,
          {
            bucket: bucketName,
            contentType: file.type,
            ...objectInfo,
          }
        );
        const totalParts = Math.ceil(file.size / partSize);

        const parts = await Promise.all(
          Array.from({ length: totalParts }, async (_, idx) => {
            const size = Math.min(partSize, file.size - idx * partSize);
            const { url: signedUrl } = await presignUploadPart(router.client, {
              bucket: bucketName,
              key: objectInfo.key,
              uploadId: multipartUploadId,
              partNumber: idx + 1,
              contentLength: size,
              expiresIn:
                route.multipart?.partSignedUrlExpiresIn ||
                config.defaultMultipartPartSignedUrlExpiresIn,
            });

            return {
              signedUrl,
              partNumber: idx + 1,
              size,
            };
          })
        );

        const [{ url: completeSignedUrl }, { url: abortSignedUrl }] =
          await Promise.all([
            presignCompleteMultipartUpload(router.client, {
              bucket: bucketName,
              key: objectInfo.key,
              uploadId: multipartUploadId,
              expiresIn:
                route.multipart?.completeSignedUrlExpiresIn ||
                config.defaultMultipartCompleteSignedUrlExpiresIn,
            }),
            presignAbortMultipartUpload(router.client, {
              bucket: bucketName,
              key: objectInfo.key,
              uploadId: multipartUploadId,
              expiresIn:
                route.multipart?.completeSignedUrlExpiresIn ||
                config.defaultMultipartCompleteSignedUrlExpiresIn,
            }),
          ]);

        return {
          file: { ...file, objectInfo },
          parts,
          uploadId: multipartUploadId,
          completeSignedUrl,
          abortSignedUrl,
        };
      })
    )
  ).filter((i) => i !== null);

  let responseMetadata;
  try {
    const onAfterPresignResult = await route.onAfterPresign?.({
      req,
      files: signedUrls.map(({ file }) => file),
      clientMetadata,
      metadata: interMetadata,
    });

    responseMetadata = onAfterPresignResult?.metadata || {};
  } catch (error) {
    throw error;
  }

  if (route.multipart) {
    return Response.json({
      metadata: responseMetadata,
      multipart: {
        partSize,
        uploads: signedUrls.map((u) => {
          if ('signedUrl' in u) {
            throw new Error(
              'Unreachable: non-multipart upload in multipart route'
            );
          }
          return u;
        }),
      },
    } satisfies UploadRequestSuccessResponse);
  }

  return Response.json({
    metadata: responseMetadata,
    uploads: signedUrls.map((u) => {
      if ('parts' in u) {
        throw new Error('Unreachable: multipart upload in non-multipart route');
      }
      return u;
    }),
  } satisfies UploadRequestSuccessResponse);
}
