import type { Client } from '@/types/clients';
import type { StorageClass } from '@/types/s3';
import { throwS3Error } from '@/utils/s3';
import { parseXml } from '@/utils/xml';

/**
 * List the objects in an S3 bucket using the ListObjectsV2 command.
 */
export async function listObjectsV2(
  client: Client,
  params: {
    bucket: string;
    continuationToken?: string;
    delimiter?: string;
    encodingType?: string;
    fetchOwner?: boolean;
    maxKeys?: number;
    prefix?: string;
    startAfter?: string;
  }
) {
  const url = new URL(client.buildBucketUrl(params.bucket));
  url.searchParams.set('list-type', '2');

  if (params.continuationToken) {
    url.searchParams.set('continuation-token', params.continuationToken);
  }
  if (params.delimiter) {
    url.searchParams.set('delimiter', params.delimiter);
  }
  if (params.encodingType) {
    url.searchParams.set('encoding-type', params.encodingType);
  }
  if (params.fetchOwner) {
    url.searchParams.set('fetch-owner', 'true');
  }
  if (params.maxKeys) {
    url.searchParams.set('max-keys', params.maxKeys.toString());
  }
  if (params.prefix) {
    url.searchParams.set('prefix', params.prefix);
  }
  if (params.startAfter) {
    url.searchParams.set('start-after', params.startAfter);
  }

  const res = await throwS3Error(
    client.s3.fetch(url.toString(), {
      method: 'GET',
      aws: { signQuery: true, allHeaders: true },
    })
  );

  const parsed = parseXml<{
    ListBucketResult: {
      CommonPrefixes?: { Prefix: string }[];
      Contents?: {
        ChecksumAlgorithm?: string;
        ChecksumType?: string;
        ETag: string;
        Key: string;
        LastModified: string;
        Owner?: {
          DisplayName: string;
          ID: string;
        };
        RestoreStatus?: {
          IsRestoreInProgress: boolean;
          RestoreExpiration?: string;
        };
        Size: number;
        StorageClass: StorageClass;
      }[];
      ContinuationToken?: string;
      Delimiter?: string;
      EncodingType?: string;
      IsTruncated: boolean;
      KeyCount: number;
      MaxKeys: number;
      Name: string;
      NextContinuationToken?: string;
      Prefix?: string;
      StartAfter?: string;
    };
  }>(await res.text(), {
    arrayPath: ['ListBucketResult.CommonPrefixes', 'ListBucketResult.Contents'],
  });

  return {
    commonPrefixes:
      parsed.ListBucketResult.CommonPrefixes?.map((item) => ({
        prefix: item.Prefix,
      })) || [],
    contents:
      parsed.ListBucketResult.Contents?.map((item) => ({
        checksumAlgorithm: item.ChecksumAlgorithm,
        checksumType: item.ChecksumType,
        eTag: item.ETag,
        key: item.Key,
        lastModified: new Date(item.LastModified),
        owner: item.Owner
          ? {
              displayName: item.Owner.DisplayName,
              id: item.Owner.ID,
            }
          : undefined,
        restoreStatus: item.RestoreStatus
          ? {
              isRestoreInProgress: item.RestoreStatus.IsRestoreInProgress,
              restoreExpiration: item.RestoreStatus.RestoreExpiration
                ? new Date(item.RestoreStatus.RestoreExpiration)
                : undefined,
            }
          : undefined,
        size: item.Size,
        storageClass: item.StorageClass,
      })) || [],
    continuationToken: parsed.ListBucketResult.ContinuationToken,
    delimiter: parsed.ListBucketResult.Delimiter,
    encodingType: parsed.ListBucketResult.EncodingType,
    isTruncated: parsed.ListBucketResult.IsTruncated,
    keyCount: parsed.ListBucketResult.KeyCount,
    maxKeys: parsed.ListBucketResult.MaxKeys,
    name: parsed.ListBucketResult.Name,
    nextContinuationToken: parsed.ListBucketResult.NextContinuationToken,
    prefix: parsed.ListBucketResult.Prefix,
    startAfter: parsed.ListBucketResult.StartAfter,
  };
}
