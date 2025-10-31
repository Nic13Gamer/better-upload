export type ObjectAcl =
  | 'authenticated-read'
  | 'aws-exec-read'
  | 'bucket-owner-full-control'
  | 'bucket-owner-read'
  | 'private'
  | 'public-read'
  | 'public-read-write';
export type StorageClass =
  | 'DEEP_ARCHIVE'
  | 'EXPRESS_ONEZONE'
  | 'FSX_OPENZFS'
  | 'GLACIER'
  | 'GLACIER_IR'
  | 'INTELLIGENT_TIERING'
  | 'ONEZONE_IA'
  | 'OUTPOSTS'
  | 'REDUCED_REDUNDANCY'
  | 'SNOW'
  | 'STANDARD'
  | 'STANDARD_IA';
