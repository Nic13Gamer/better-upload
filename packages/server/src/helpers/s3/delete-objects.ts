import type { Client } from '@/types/clients';
import {
  encodeObjectKey,
  getBodyContentLength,
  sha256,
  throwS3Error,
} from '@/utils/s3';
import { parseXml, xml } from '@/utils/xml';

/**
 * Delete multiple objects from an S3 bucket.
 *
 * Up to 1000 objects can be deleted in a single request.
 */
export async function deleteObjects(
  client: Client,
  params: {
    bucket: string;
    objects: {
      key: string;
      /**
       * The version ID of the object to delete (if versioning is enabled).
       */
      versionId?: string;
      /**
       * The ETag of the object to delete (if conditional deletion is desired).
       */
      eTag?: string;
    }[];
    quiet?: boolean;
  }
) {
  if (params.objects.length === 0) {
    throw new Error('No objects provided for deletion.');
  }

  if (params.objects.length > 1000) {
    throw new Error(
      'Cannot delete more than 1000 objects in a single request.'
    );
  }

  const body = xml`<Delete>
  ${params.objects.map(
    (obj) => xml`<Object>
    <Key>${encodeObjectKey(obj.key)}</Key>
    ${obj.versionId ? xml`<VersionId>${obj.versionId}</VersionId>` : ''}
    ${obj.eTag ? xml`<ETag>${obj.eTag}</ETag>` : ''}
  </Object>`
  )}
  ${params.quiet ? xml`<Quiet>true</Quiet>` : ''}
</Delete>`.toString();

  const res = await throwS3Error(
    client.s3.fetch(`${client.buildBucketUrl(params.bucket)}/?delete`, {
      method: 'POST',
      headers: {
        'content-type': 'application/xml',
        'content-length': getBodyContentLength(body)!.toString(),
        'x-amz-checksum-sha256': await sha256(body),
      },
      body,
      aws: { signQuery: true, allHeaders: true },
    })
  );

  const parsed = parseXml<{
    DeleteResult: {
      Deleted?: {
        DeleteMarker?: boolean;
        DeleteMarkerVersionId?: string;
        Key: string;
        VersionId?: string;
      }[];
      Error?: {
        Code: string;
        Key: string;
        Message: string;
        VersionId?: string;
      }[];
    };
  }>(await res.text(), {
    arrayPath: ['DeleteResult.Deleted', 'DeleteResult.Error'],
  });

  return {
    deleted:
      parsed.DeleteResult.Deleted?.map((i) => ({
        deleteMarker: i.DeleteMarker,
        deleteMarkerVersionId: i.DeleteMarkerVersionId,
        key: i.Key,
        versionId: i.VersionId,
      })) || [],
    errors:
      parsed.DeleteResult.Error?.map((i) => ({
        code: i.Code,
        message: i.Message,
        key: i.Key,
        versionId: i.VersionId,
      })) || [],
  };
}
