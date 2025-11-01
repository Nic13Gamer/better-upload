import type { Client } from '@/types/clients';
import { throwS3Error } from '@/utils/s3';

/**
 * Move an object from one key to another inside an S3 bucket.
 *
 * **WARNING:** This copies the object to the new key and then deletes the original object. It can be slow.
 */
export async function moveObject(
  client: Client,
  params: {
    bucket: string;

    /**
     * The key of the object to move. Do not include the bucket name.
     *
     * @example 'example.jpg'
     */
    fromKey: string;

    /**
     * The key of where the object will be moved to. Do not include the bucket name.
     *
     * @example 'images/example.jpg'
     */
    toKey: string;
  }
) {
  await throwS3Error(
    client.s3.fetch(`${client.buildBucketUrl(params.bucket)}/${params.toKey}`, {
      method: 'PUT',
      headers: {
        'x-amz-copy-source': `${params.bucket}/${params.fromKey}`,
      },
      aws: { signQuery: true, allHeaders: true },
    })
  );

  await throwS3Error(
    client.s3.fetch(
      `${client.buildBucketUrl(params.bucket)}/${params.fromKey}`,
      {
        method: 'DELETE',
        aws: { signQuery: true, allHeaders: true },
      }
    )
  );
}
