import { createHash } from 'crypto';
import type { Client } from '@/types/clients';
import { throwS3Error } from '@/utils/s3';
import { parseXml } from '@/utils/xml';

/**
 * Delete an object from an S3 bucket.
 */
export async function deleteObjects(
  client: Client,
  params: {
    bucket: string;
    /**
     * Array of objects to delete.
     */
    objects: Array<{
      key: string;
    /**
     * The version ID of the object to delete (if versioning is enabled).
     */
      versionId?: string;
    }>;
  }
) {
  if (params.objects.length === 0) {
    throw new Error('No objects provided for deletion.');
  }

  for (const obj of params.objects) {
    if (!obj.key.trim()) {
      throw new Error('Object keys cannot be empty.');
    }
  }

  if (params.objects.length > 1000) {
    throw new Error('Cannot delete more than 1000 objects in a single request.');
  }

  const objectsXml = params.objects
    .map(
      (obj) => `
      <Object>
        <Key>${obj.key}</Key>
        ${obj.versionId ? `<VersionId>${obj.versionId}</VersionId>` : ''}
      </Object>
    `
    )
    .join('');

  const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
    <Delete>
      ${objectsXml}
    </Delete>`;

  const url = new URL(`${client.buildBucketUrl(params.bucket)}?delete`);

  const md5 = createHash('md5').update(xmlBody).digest('base64');
const res = await throwS3Error(
    client.s3.fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-MD5': md5,
        'Content-Type': 'application/xml',
      },
      body: xmlBody,
      aws: { signQuery: true, allHeaders: true },
    })
  );

  const parsed = parseXml<{
    DeleteResult: {
      Deleted?:
        | {
            Key: string;
            VersionId?: string;
            DeleteMarker?: boolean;
            DeleteMarkerVersionId?: string;
          }
        | Array<{
            Key: string;
            VersionId?: string;
            DeleteMarker?: boolean;
            DeleteMarkerVersionId?: string;
          }>;
      Error?:
        | { Key: string; VersionId?: string; Code: string; Message: string }
        | Array<{
            Key: string;
            VersionId?: string;
            Code: string;
            Message: string;
          }>;
    };
  }>(await res.text());

  const toArray = <T>(item: T | T[] | undefined): T[] => {
    if (!item) return [];
    return Array.isArray(item) ? item : [item];
  };

  return {
    deleted: toArray(parsed.DeleteResult.Deleted).map((d) => ({
      key: d.Key,
      versionId: d.VersionId,
      deleteMarker: d.DeleteMarker,
      deleteMarkerVersionId: d.DeleteMarkerVersionId,
    })),
    errors: toArray(parsed.DeleteResult.Error).map((e) => ({
      key: e.Key,
      versionId: e.VersionId,
      code: e.Code,
      message: e.Message,
    })),
  };
}



