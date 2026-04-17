import { config } from '@/config';
import { S3Error } from '@/error';
import { listParts } from '@/helpers/s3/list-parts';
import type { Client } from '@/types/clients';
import type { Route } from '@/types/router/internal';
import type { ObjectMetadata } from '@/types/s3';
import { isFileTypeAllowed } from '@/utils/file-type';
import {
  createMultipartUpload,
  signAbortMultipartUpload,
  signCompleteMultipartUpload,
  signUploadPart,
} from '@/utils/s3';
import { createSlug } from '@/utils/slug';
import type { UploadFileSchema } from '@/validations';
import { RejectUpload } from '../route';

export async function handleMultipartFiles({
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

  const signedUrls = (
    await Promise.all(
      files.map(async (file) => {
        let objectKey = `${crypto.randomUUID()}-${createSlug(file.name)}`;
        let objectMetadata = {} as ObjectMetadata;
        let objectAcl,
          objectStorageClass,
          objectCacheControl,
          objectTagging,
          skip = undefined;

        const resume = file.resume;

        if (resume) {
          objectKey = resume.key;
        } else if (generateObjectInfoCallback) {
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
          objectTagging = objectInfo.tagging;
          skip = objectInfo.skip;
        }

        if (skip === 'ignore') {
          return null;
        } else if (skip === 'completed') {
          return {
            file: {
              ...file,
              objectInfo: {
                key: objectKey,
                metadata: objectMetadata,
                acl: objectAcl,
                storageClass: objectStorageClass,
                cacheControl: objectCacheControl,
                tagging: objectTagging,
              },
            },
            parts: [],
            uploadId: '',
            completeSignedUrl: '',
            abortSignedUrl: '',
            skip: 'completed',
          };
        }

        const createParams = {
          bucket: bucketName,
          key: objectKey,
          contentType: file.type,
          metadata: objectMetadata,
          acl: objectAcl,
          storageClass: objectStorageClass,
          cacheControl: objectCacheControl,
          tagging: objectTagging,
        };

        let s3UploadId: string;
        const completedPartsMap = new Map<
          number,
          { partNumber: number; eTag: string; size: number }
        >();

        if (resume) {
          s3UploadId = resume.uploadId;
          try {
            let partNumberMarker: number | undefined;
            do {
              const page = await listParts(client, {
                bucket: bucketName,
                key: objectKey,
                uploadId: s3UploadId,
                partNumberMarker,
              });
              for (const part of page.parts) {
                completedPartsMap.set(part.partNumber, {
                  partNumber: part.partNumber,
                  eTag: part.eTag,
                  size: part.size,
                });
              }
              partNumberMarker = page.isTruncated
                ? page.nextPartNumberMarker
                : undefined;
            } while (partNumberMarker);
          } catch (error) {
            if (
              error instanceof S3Error &&
              error.message.includes('NoSuchUpload')
            ) {
              // The multipart upload expired or was aborted on S3. Start fresh.
              completedPartsMap.clear();
              s3UploadId = (await createMultipartUpload(client, createParams))
                .uploadId;
            } else {
              throw error;
            }
          }
        } else {
          s3UploadId = (await createMultipartUpload(client, createParams))
            .uploadId;
        }

        const totalParts = Math.ceil(file.size / partSize);

        const partSignedUrls = (
          await Promise.all(
            Array.from({ length: totalParts }, async (_, index) => {
              const partNumber = index + 1;
              if (completedPartsMap.has(partNumber)) return null;

              const size = Math.min(partSize, file.size - index * partSize);

              const url = await signUploadPart(client, {
                bucket: bucketName,
                key: objectKey,
                uploadId: s3UploadId,
                partNumber,
                contentLength: size,
                expiresIn: partSignedUrlExpiresIn,
              });

              return {
                signedUrl: url,
                partNumber,
                size,
              };
            })
          )
        ).filter((p) => p !== null);

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
          file: {
            ...file,
            objectInfo: {
              key: objectKey,
              metadata: objectMetadata,
              acl: objectAcl,
              storageClass: objectStorageClass,
              cacheControl: objectCacheControl,
              tagging: objectTagging,
            },
          },
          parts: partSignedUrls,
          ...(completedPartsMap.size > 0
            ? {
                completedParts: Array.from(completedPartsMap.values()).sort(
                  (a, b) => a.partNumber - b.partNumber
                ),
              }
            : {}),
          uploadId: s3UploadId!,
          completeSignedUrl,
          abortSignedUrl,
        };
      })
    )
  ).filter((i) => i !== null);

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
      files: signedUrls.map((url) => ({
        ...url,
        file: {
          ...url.file,
          objectInfo: {
            key: url.file.objectInfo.key,
            metadata: url.file.objectInfo.metadata,
            cacheControl: url.file.objectInfo.cacheControl,
          },
        },
      })),
      partSize,
    },
    metadata: responseMetadata,
  });
}
