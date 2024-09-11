import { config } from '@/server/config';
import { UploadFileError } from '@/server/error';
import type { Route } from '@/server/types/internal';
import { createSlug } from '@/server/utils/internal/slug';
import { isFileTypeAllowed } from '@/server/utils/internal/upload-file';
import type { UploadFileSchema } from '@/server/validations';
import { PutObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextRequest, NextResponse } from 'next/server';

export async function handleFile({
  req,
  client,
  bucketName,
  route,
  data,
}: {
  req: NextRequest;
  client: S3Client;
  bucketName: string;
  route: Route<any, false>;
  data: UploadFileSchema;
}) {
  const file = data.files[0]!;
  const maxFileSize = route.maxFileSize || config.defaultMaxFileSize;

  if (file.size > maxFileSize) {
    return NextResponse.json(
      {
        error: {
          type: 'file_too_large',
          message: 'File size is too large.',
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
          message: 'Invalid file type.',
        },
      },
      { status: 400 }
    );
  }

  let objectKey = `${crypto.randomUUID()}-${createSlug(file.name)}`;
  let beforeUploadMetadata = {};
  try {
    const onBeforeUpload = await route.onBeforeUpload?.({
      req,
      file,
      clientMetadata: data.metadata || {},
    });

    if (onBeforeUpload?.objectKey) {
      objectKey = onBeforeUpload.objectKey;
    }

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

  const signedUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: file.type,
      ContentLength: file.size,
    }),
    { expiresIn: route.signedUrlExpiresIn || config.defaultSignedUrlExpiresIn }
  );

  let responseMetadata = {};
  try {
    const onAfterSignedUrl = await route.onAfterSignedUrl?.({
      req,
      file: { ...file, objectKey },
      metadata: beforeUploadMetadata,
      clientMetadata: data.metadata || {},
    });

    responseMetadata = onAfterSignedUrl?.metadata || {};
  } catch (error) {
    throw error;
  }

  return NextResponse.json({
    signedUrl,
    metadata: responseMetadata,
    file: {
      ...file,
      objectKey,
    },
  });
}
