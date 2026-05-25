import { defineHelper } from '@/utils/define-helper';
import { parseXml } from '@/utils/xml';
import type { StorageClass } from '@repo/shared/types/s3';

const helper = defineHelper<
  {
    bucket: string;
    continuationToken?: string;
    delimiter?: string;
    encodingType?: string;
    fetchOwner?: boolean;
    maxKeys?: number;
    prefix?: string;
    startAfter?: string;
  },
  {},
  {
    commonPrefixes: { prefix: string }[];
    contents: {
      checksumAlgorithm?: string;
      checksumType?: string;
      eTag: string;
      key: string;
      lastModified: Date;
      owner?: { displayName: string; id: string };
      restoreStatus?: {
        isRestoreInProgress: boolean;
        restoreExpiration?: Date;
      };
      size: number;
      storageClass: StorageClass;
    }[];
    continuationToken?: string;
    delimiter?: string;
    encodingType?: string;
    isTruncated: boolean;
    keyCount: number;
    maxKeys: number;
    name: string;
    nextContinuationToken?: string;
    prefix?: string;
    startAfter?: string;
  }
>({
  method: 'GET',
  url: (params) => ({
    url: '',
    searchParams: {
      'list-type': '2',
      'continuation-token': params.continuationToken,
      delimiter: params.delimiter,
      'encoding-type': params.encodingType,
      'fetch-owner': params.fetchOwner ? 'true' : undefined,
      'max-keys': params.maxKeys,
      prefix: params.prefix,
      'start-after': params.startAfter,
    },
  }),
  execute: {
    parseData: async (res) => {
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
        arrayPath: [
          'ListBucketResult.CommonPrefixes',
          'ListBucketResult.Contents',
        ],
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
    },
  },
});

/**
 * Generate a pre-signed URL for listing objects in an S3 bucket using the ListObjectsV2 command.
 */
export const presignListObjectsV2 = helper.presign;

/**
 * List the objects in an S3 bucket using the ListObjectsV2 command.
 */
export const listObjectsV2 = helper.execute;
