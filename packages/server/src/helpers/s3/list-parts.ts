import type { Client } from '@/types/clients';
import { throwS3Error } from '@/utils/s3';
import { parseXml } from '@/utils/xml';

/**
 * List the parts already uploaded for an in-progress multipart upload.
 */
export async function listParts(
  client: Client,
  params: {
    bucket: string;
    key: string;
    uploadId: string;
    maxParts?: number;
    partNumberMarker?: number;
  }
) {
  if (!params.key.trim()) {
    throw new Error('The object key cannot be empty.');
  }

  const url = new URL(`${client.buildBucketUrl(params.bucket)}/${params.key}`);
  url.searchParams.set('uploadId', params.uploadId);

  if (params.maxParts) {
    url.searchParams.set('max-parts', params.maxParts.toString());
  }
  if (params.partNumberMarker) {
    url.searchParams.set(
      'part-number-marker',
      params.partNumberMarker.toString()
    );
  }

  const res = await throwS3Error(
    client.s3.fetch(url.toString(), {
      method: 'GET',
      aws: { signQuery: true, allHeaders: true },
    })
  );

  const parsed = parseXml<{
    ListPartsResult: {
      Bucket: string;
      Key: string;
      UploadId: string;
      PartNumberMarker?: number;
      NextPartNumberMarker?: number;
      MaxParts: number;
      IsTruncated: boolean;
      Part?: {
        PartNumber: number;
        ETag: string;
        Size: number;
        LastModified: string;
      }[];
    };
  }>(await res.text(), {
    arrayPath: ['ListPartsResult.Part'],
  });

  return {
    bucket: parsed.ListPartsResult.Bucket,
    key: parsed.ListPartsResult.Key,
    uploadId: parsed.ListPartsResult.UploadId,
    partNumberMarker: parsed.ListPartsResult.PartNumberMarker,
    nextPartNumberMarker: parsed.ListPartsResult.NextPartNumberMarker,
    maxParts: parsed.ListPartsResult.MaxParts,
    isTruncated: parsed.ListPartsResult.IsTruncated,
    parts:
      parsed.ListPartsResult.Part?.map((item) => ({
        partNumber: item.PartNumber,
        eTag: item.ETag,
        size: item.Size,
        lastModified: new Date(item.LastModified),
      })) || [],
  };
}
