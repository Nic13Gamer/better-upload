import type { Route } from "@/server/types/internal";
import type { UploadFileSchema } from "@/server/validations";
import type { S3Client } from "@aws-sdk/client-s3";

export async function handleMultipartFiles({
  req,
  client,
  bucketName,
  route,
  data,
}: {
  req: Request;
  client: S3Client;
  bucketName: string;
  route: Route;
  data: UploadFileSchema;
}) {
  return new Response('not implemented');
}
