import type { Client } from '@/types/clients';
import { copyObject } from './copy-object';
import { deleteObject } from './delete-object';

/**
 * Move an object from one key to another, within or between, S3 buckets.
 *
 * **WARNING:** This copies the object to the new key and then deletes the original object. It can be slow.
 */
export async function moveObject(
  client: Client,
  params: {
    source: {
      bucket: string;
      key: string;
    };
    destination: {
      bucket: string;
      key: string;
    };
  }
) {
  if (!params.source.key.trim()) {
    throw new Error('The source object key cannot be empty.');
  }

  await copyObject(client, params);
  await deleteObject(client, {
    bucket: params.source.bucket,
    key: params.source.key,
  });
}
