import type {
  ExecRoute,
  Metadata,
  ObjectMetadata,
  Route,
  RouteConfig,
} from '../types/internal';

export function route<
  M extends Metadata = {},
  U extends boolean = false,
  T extends boolean = false,
>(config: RouteConfig<M, U, T>): ExecRoute {
  const route: Route = {
    maxFileSize: config.maxFileSize,
    fileTypes: config.fileTypes,
    signedUrlExpiresIn: config.signedUrlExpiresIn,

    maxFiles: config.multipleFiles ? config.maxFiles : 1,

    multipart: config.multipart
      ? {
          partSize: config.partSize,
          partSignedUrlExpiresIn: config.partSignedUrlExpiresIn,
          completeSignedUrlExpiresIn: config.completeSignedUrlExpiresIn,
        }
      : undefined,

    onBeforeUpload: config.onBeforeUpload
      ? async (data) => {
          if (config.onBeforeUpload) {
            const files = config.multipleFiles ? data.files : data.files[0];

            const res = await config.onBeforeUpload({
              req: data.req,
              clientMetadata: data.clientMetadata,
              [config.multipleFiles ? 'files' : 'file']: files,
            } as any);

            if (res) {
              const generateObjectKey =
                'generateObjectKey' in res
                  ? res.generateObjectKey
                  : 'objectKey' in res
                    ? () => res.objectKey as string
                    : undefined;

              const generateObjectMetadata =
                'generateObjectMetadata' in res
                  ? res.generateObjectMetadata
                  : 'objectMetadata' in res
                    ? () => res.objectMetadata as ObjectMetadata
                    : undefined;

              return {
                metadata: res.metadata,
                bucketName: res.bucketName,
                generateObjectKey,
                generateObjectMetadata,
              };
            } else {
              return res;
            }
          }
        }
      : undefined,

    onAfterSignedUrl: config.onAfterSignedUrl
      ? async (data) => {
          if (config.onAfterSignedUrl) {
            const files = config.multipleFiles ? data.files : data.files[0];

            return config.onAfterSignedUrl({
              req: data.req,
              metadata: data.metadata,
              clientMetadata: data.clientMetadata,
              [config.multipleFiles ? 'files' : 'file']: files,
            } as any);
          }
        }
      : undefined,
  };

  return () => route;
}
