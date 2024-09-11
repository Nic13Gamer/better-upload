import { CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { HelperBaseParams } from '../types/internal';

/**
 * Move an object from one location to another inside an S3 bucket.
 *
 * **WARNING:** This copies the object to the new location and then deletes the original object. It can be slow.
 */
export async function moveObject({
  client,
  bucketName,
  objectKey,
  destinationKey,
}: HelperBaseParams & {
  /**
   * The key of the object to move. Do not include the bucket name.
   *
   * @example 'example.jpg'
   */
  objectKey: string;

  /**
   * The key of where the object will be moved to. Do not include the bucket name.
   *
   * @example 'images/example.jpg'
   */
  destinationKey: string;
}) {
  await client.send(
    new CopyObjectCommand({
      Bucket: bucketName,
      CopySource: `${bucketName}/${objectKey}`,
      Key: destinationKey,
    })
  );

  await client.send(
    new DeleteObjectCommand({ Bucket: bucketName, Key: objectKey })
  );
}
