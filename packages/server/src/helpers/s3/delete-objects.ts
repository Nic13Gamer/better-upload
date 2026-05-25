import { defineHelper } from '@/utils/define-helper';
import { encodeObjectKey } from '@/utils/s3';
import { parseXml, xml } from '@/utils/xml';

const helper = defineHelper<
  {
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
  },
  {},
  {
    deleted: {
      deleteMarker?: boolean;
      deleteMarkerVersionId?: string;
      key: string;
      versionId?: string;
    }[];
    errors: {
      code: string;
      message: string;
      key: string;
      versionId?: string;
    }[];
  }
>({
  method: 'POST',
  url: () => ({
    url: '/?delete',
  }),
  execute: {
    buildBody: (params) => {
      if (params.objects.length === 0) {
        throw new Error('No objects provided for deletion.');
      }
      if (params.objects.length > 1000) {
        throw new Error(
          'Cannot delete more than 1000 objects in a single request.'
        );
      }

      return xml`<Delete>
  ${params.objects.map(
    (obj) => xml`<Object>
    <Key>${encodeObjectKey(obj.key)}</Key>
    ${obj.versionId ? xml`<VersionId>${obj.versionId}</VersionId>` : ''}
    ${obj.eTag ? xml`<ETag>${obj.eTag}</ETag>` : ''}
  </Object>`
  )}
  ${params.quiet ? xml`<Quiet>true</Quiet>` : ''}
</Delete>`;
    },
    xmlChecksumHeader: true,
    parseData: async (res) => {
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
    },
  },
});

/**
 * Generate a pre-signed URL for deleting multiple objects from an S3 bucket.
 *
 * Up to 1000 objects can be deleted in a single request.
 */
export const presignDeleteObjects = helper.presign;

/**
 * Delete multiple objects from an S3 bucket.
 *
 * Up to 1000 objects can be deleted in a single request.
 */
export const deleteObjects = helper.execute;
