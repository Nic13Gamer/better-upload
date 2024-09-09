import { config } from '@/server/config';
import { UploadFileError } from '@/server/error';
import type { Route } from '@/server/types/internal';
import { createSlug } from '@/server/utils/internal/slug';
import { isFileTypeAllowed } from '@/server/utils/internal/upload-file';
import type { UploadFileSchema } from '@/server/validations';
import { PutObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse, type NextRequest } from 'next/server';

export async function handleFiles({
  req,
  client,
  bucketName,
  route,
  data,
}: {
  req: NextRequest;
  client: S3Client;
  bucketName: string;
  route: Route<any, true>;
  data: UploadFileSchema;
}) {
  const { files } = data;
  const maxFiles = route.maxFiles || config.defaultMaxFiles;
  const maxFileSize = route.maxFileSize || config.defaultMaxFileSize;

  if (files.length > maxFiles) {
    return NextResponse.json(
      {
        error: {
          type: 'too_many_files',
          message: 'Too many files.',
        },
      },
      { status: 400 }
    );
  }

  files.forEach((file) => {
    if (file.size > maxFileSize) {
      return NextResponse.json(
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
      return NextResponse.json(
        {
          error: {
            type: 'invalid_file_type',
            message: 'One or more files have an invalid file type.',
          },
        },
        { status: 400 }
      );
    }
  });

  let beforeUploadMetadata = {};
  try {
    const onBeforeUpload = await route.onBeforeUpload?.({
      req,
      files,
      clientMetadata: data.metadata || {},
    });

    beforeUploadMetadata = onBeforeUpload?.metadata || {};
  } catch (error) {
    if (error instanceof UploadFileError) {
      return NextResponse.json(
        { error: { type: 'rejected', message: error.message } },
        { status: 400 }
      );
    }

    throw error;
  }

  const signedUrls = await Promise.all(
    files.map(async (file) => {
      let bucketKey = `${crypto.randomUUID()}-${createSlug(file.name)}`;

      if (route.generateBucketKey) {
        bucketKey = await route.generateBucketKey({
          req,
          file,
          metadata: beforeUploadMetadata,
          clientMetadata: data.metadata || {},
        });
      }

      const signedUrl = await getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: bucketName,
          Key: bucketKey,
          ContentType: file.type,
          ContentLength: file.size,
        }),
        {
          expiresIn:
            route.signedUrlExpiresIn || config.defaultSignedUrlExpiresIn,
        }
      );

      return { signedUrl, bucketKey, file };
    })
  );

  let responseMetadata = {};
  try {
    const onAfterSignedUrl = await route.onAfterSignedUrl?.({
      req,
      files: signedUrls.map(({ file, bucketKey }) => ({
        ...file,
        bucketKey,
      })),
      metadata: beforeUploadMetadata,
      clientMetadata: data.metadata || {},
    });

    responseMetadata = onAfterSignedUrl?.metadata || {};
  } catch (error) {
    throw error;
  }

  return NextResponse.json({
    metadata: responseMetadata,
    signedUrls,
  });
}
