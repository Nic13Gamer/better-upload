import { config } from '@/config';
import { RejectUpload } from '@/error';
import type { ClientConfig } from '@/types/clients';
import type { ObjectMetadata, Route } from '@/types/router/internal';
import {
  createMultipartUpload,
  signAbortMultipartUpload,
  signCompleteMultipartUpload,
  signUploadPart,
} from '@/utils/internal/aws';
import { isFileTypeAllowed } from '@/utils/internal/file-type';
import { createSlug } from '@/utils/internal/slug';
import type { UploadFileSchema } from '@/validations';

export async function handleMultipartFiles({
  req,
  client,
  defaultBucketName,
  route,
  data,
}: {
  req: Request;
  client: ClientConfig;
  defaultBucketName: string;
  route: Route;
  data: UploadFileSchema;
}) {
  const { files } = data;
  const maxFiles = route.maxFiles || config.defaultMaxFiles;
  const maxFileSize = route.maxFileSize || config.defaultMaxFileSize;

  const partSize = route.multipart?.partSize || config.defaultMultipartPartSize;
  const partSignedUrlExpiresIn =
    route.multipart?.partSignedUrlExpiresIn ||
    config.defaultMultipartPartSignedUrlExpiresIn;
  const completeSignedUrlExpiresIn =
    route.multipart?.completeSignedUrlExpiresIn ||
    config.defaultMultipartCompleteSignedUrlExpiresIn;

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

    if (route.fileTypes && !isFileTypeAllowed(file.type, route.fileTypes)) {
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

      const { uploadId: s3UploadId } = await createMultipartUpload(client, {
        bucket: bucketName,
        key: objectKey,
        contentType: file.type,
        metadata: objectMetadata,
        acl: objectAcl,
        storageClass: objectStorageClass,
        cacheControl: objectCacheControl,
      });

      const totalParts = Math.ceil(file.size / partSize);

      const partSignedUrls = await Promise.all(
        Array.from({ length: totalParts }, async (_, index) => {
          const size = Math.min(partSize, file.size - index * partSize);

          const url = await signUploadPart(client, {
            bucket: bucketName,
            key: objectKey,
            uploadId: s3UploadId,
            partNumber: index + 1,
            contentLength: size,
            expiresIn: partSignedUrlExpiresIn,
          });

          return {
            signedUrl: url,
            partNumber: index + 1,
            size,
          };
        })
      );

      const [completeSignedUrl, abortSignedUrl] = await Promise.all([
        signCompleteMultipartUpload(client, {
          bucket: bucketName,
          key: objectKey,
          uploadId: s3UploadId,
          expiresIn: completeSignedUrlExpiresIn,
        }),
        signAbortMultipartUpload(client, {
          bucket: bucketName,
          key: objectKey,
          uploadId: s3UploadId,
          expiresIn: completeSignedUrlExpiresIn,
        }),
      ]);

      return {
        file: { ...file, objectKey, objectMetadata },
        parts: partSignedUrls,
        uploadId: s3UploadId!,
        completeSignedUrl,
        abortSignedUrl,
      };
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
    multipart: {
      files: signedUrls,
      partSize,
    },
    metadata: responseMetadata,
  });
}
