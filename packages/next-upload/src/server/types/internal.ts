import type { NextRequest } from 'next/server';

export type Metadata = Record<string, string>;
export type OptionalMetadata = Record<string, string | undefined>;

export type UploadedFileInfo = {
  name: string;
  size: number;
  type: string;
  bucketKey: string;
};

export type ExecRoute = () => Route<any>;

export type Route<M> = {
  maxFileSize?: number;

  /**
   * Allowed file types.
   *
   * @default [] // All file types are allowed
   *
   * @example
   *
   * ```ts
   * fileTypes: ['image/png', 'image/jpeg'] // Only PNG and JPEG files are allowed
   * ```
   *
   * @example
   *
   * ```ts
   * fileTypes: ['image/*'] // All image files are allowed
   * ```
   */
  fileTypes?: string[];
  signedUrlExpiresIn?: number;

  onBeforeUpload?: (data: {
    req: NextRequest;
    file: Omit<UploadedFileInfo, 'bucketKey'>;
    clientMetadata: OptionalMetadata;
  }) =>
    | { bucketKey?: string; metadata?: M }
    | void
    | Promise<{ bucketKey?: string; metadata?: M } | void>;

  onAfterSignedUrl?: (data: {
    req: NextRequest;
    file: UploadedFileInfo;
    metadata: M;
    clientMetadata: OptionalMetadata;
  }) =>
    | { metadata?: Record<string, string> }
    | void
    | Promise<{ metadata?: Record<string, string> } | void>;
};
