import { config } from '@/config';
import type { Client } from '@/types/clients';
import type { Route } from '@/types/router/internal';
import type { ObjectMetadata } from '@/types/s3';
import { isFileTypeAllowed } from '@/utils/file-type';
import { signPutObject, generateSignedForm } from '@/utils/s3';
import { createSlug } from '@/utils/slug';
import type { UploadFileSchema } from '@/validations';
import { RejectUpload } from '../route';

/**
 * Handles single-part file uploads by generating signed URLs or POST forms for direct S3 uploads.
 *
 * This function processes file upload requests, validates files against route constraints,
 * calls route lifecycle hooks, and generates the appropriate signed URLs or POST forms
 * based on the configured upload method. It supports both PUT and POST upload methods.
 *
 * @param params - Handler configuration object
 * @param params.req - The incoming HTTP request object
 * @param params.client - S3-compatible client instance for signing operations
 * @param params.defaultBucketName - Default S3 bucket name to use if not overridden
 * @param params.route - Route configuration containing upload constraints and hooks
 * @param params.data - Validated upload request data containing files and metadata
 *
 * @returns Promise resolving to a Response object containing:
 *   - `method`: Upload method ('put' or 'post')
 *   - `files`: Array of file objects with signed URLs or POST forms
 *   - `metadata`: Server metadata returned from route hooks
 *
 * @throws {Response} HTTP 400 responses for validation errors:
 *   - 'too_many_files': When file count exceeds route.maxFiles
 *   - 'file_too_large': When files exceed size limits (route or S3 5GB limit)
 *   - 'invalid_file_type': When file types don't match route.fileTypes
 *   - 'rejected': When route.onBeforeUpload throws RejectUpload
 *
 * @throws {Error} Re-throws any unexpected errors from route hooks
 */
export async function handleFiles({
  req,
  client,
  defaultBucketName,
  route,
  data,
}: {
  req: Request;
  client: Client;
  defaultBucketName: string;
  route: Route;
  data: UploadFileSchema;
}) {
  const { files } = data;
  const maxFiles = route.maxFiles || config.defaultMaxFiles;
  const maxFileSize = route.maxFileSize || config.defaultMaxFileSize;

  const signedUrlExpiresIn =
    route.signedUrlExpiresIn || config.defaultSignedUrlExpiresIn;

  if (files.length > maxFiles) {
    return Response.json(
      {
        error: {
          type: 'too_many_files',
          message: 'Too many files.',
        },
      },
      { status: 400 }
    );
  }

  for (const file of files) {
    if (file.size > 1024 * 1024 * 5000) {
      return Response.json(
        {
          error: {
            type: 'file_too_large',
            message:
              'One or more files exceed the S3 limit of 5GB. Use multipart upload for larger files.',
          },
        },
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
        },
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
        },
        { status: 400 }
      );
    }
  }

  let interMetadata, bucketName, generateObjectInfoCallback;
  try {
    const onBeforeUpload = await route.onBeforeUpload?.({
      req,
      files,
      clientMetadata: data.metadata,
    });

    interMetadata = onBeforeUpload?.metadata || {};
    bucketName = onBeforeUpload?.bucketName || defaultBucketName;
    generateObjectInfoCallback = onBeforeUpload?.generateObjectInfo || null;
  } catch (error) {
    if (error instanceof RejectUpload) {
      return Response.json(
        { error: { type: 'rejected', message: error.message } },
        { status: 400 }
      );
    }

    throw error;
  }

  // Determine upload method (default to 'put' for backward compatibility)
  const uploadMethod = route.uploadMethod || 'put';

  const signedUrls = await Promise.all(
    files.map(async (file) => {
      let objectKey = `${crypto.randomUUID()}-${createSlug(file.name)}`;
      let objectMetadata = {} as ObjectMetadata;
      let objectAcl = undefined;
      let objectStorageClass = undefined;
      let objectCacheControl = undefined;

      if (generateObjectInfoCallback) {
        const objectInfo = await generateObjectInfoCallback({ file });

        if (objectInfo.key) {
          objectKey = objectInfo.key;
        }
        if (objectInfo.metadata) {
          objectMetadata = Object.fromEntries(
            Object.entries(objectInfo.metadata).map(([key, value]) => [
              key.toLowerCase(),
              value,
            ])
          );
        }

        objectAcl = objectInfo.acl;
        objectStorageClass = objectInfo.storageClass;
        objectCacheControl = objectInfo.cacheControl;
      }

      // Sign based on upload method
      if (uploadMethod === 'post') {
        const postForm = generateSignedForm(client, {
          bucket: bucketName,
          key: objectKey,
          contentType: file.type,
          contentLength: file.size,
          metadata: objectMetadata,
          acl: objectAcl,
          storageClass: objectStorageClass,
          cacheControl: objectCacheControl,
          expiresIn: signedUrlExpiresIn,
        });

        return {
          postForm,
          file: {
            ...file,
            objectInfo: {
              key: objectKey,
              metadata: objectMetadata,
              acl: objectAcl,
              storageClass: objectStorageClass,
              cacheControl: objectCacheControl,
            },
          },
        };
      } else {
        const signedUrl = await signPutObject(client, {
          bucket: bucketName,
          key: objectKey,
          contentType: file.type,
          contentLength: file.size,
          metadata: objectMetadata,
          acl: objectAcl,
          storageClass: objectStorageClass,
          cacheControl: objectCacheControl,
          expiresIn: signedUrlExpiresIn,
        });

        return {
          signedUrl,
          file: {
            ...file,
            objectInfo: {
              key: objectKey,
              metadata: objectMetadata,
              acl: objectAcl,
              storageClass: objectStorageClass,
              cacheControl: objectCacheControl,
            },
          },
        };
      }
    })
  );

  let responseMetadata;
  try {
    const onAfterSignedUrl = await route.onAfterSignedUrl?.({
      req,
      files: signedUrls.map(({ file }) => file),
      metadata: interMetadata,
      clientMetadata: data.metadata,
    });

    responseMetadata = onAfterSignedUrl?.metadata || {};
  } catch (error) {
    throw error;
  }

  return Response.json({
    method: uploadMethod,
    files: signedUrls.map((url) => {
      const fileResponse = {
        file: {
          ...url.file,
          objectInfo: {
            key: url.file.objectInfo.key,
            metadata: url.file.objectInfo.metadata,
            acl: url.file.objectInfo.acl,
            storageClass: url.file.objectInfo.storageClass,
            cacheControl: url.file.objectInfo.cacheControl,
          },
        },
      };

      if (uploadMethod === 'put') {
        return { ...fileResponse, signedUrl: url.signedUrl };
      } else {
        return { ...fileResponse, postForm: url.postForm };
      }
    }),
    metadata: responseMetadata,
  });
}
