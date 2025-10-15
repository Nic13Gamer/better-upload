import type {
  BeforeUploadCallbackObjectInfo,
  ExecRoute,
  Route,
  RouteConfig,
  UnknownMetadata,
} from '../types/internal';
import type { StandardSchemaV1 } from '../types/standard-schema';

export function route<
  Multiple extends boolean = false,
  Multipart extends boolean = false,
  InterMetadata extends UnknownMetadata = {},
  ClientMetadataSchema extends StandardSchemaV1 | undefined = undefined,
>(
  config: RouteConfig<Multiple, Multipart, InterMetadata, ClientMetadataSchema>
): ExecRoute {
  const route: Route = {
    maxFileSize: config.maxFileSize,
    fileTypes: config.fileTypes,
    signedUrlExpiresIn: config.signedUrlExpiresIn,
    clientMetadataSchema: config.clientMetadataSchema,

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
              const generateObjectInfo =
                'generateObjectInfo' in res
                  ? res.generateObjectInfo
                  : 'objectInfo' in res
                    ? () =>
                        ({
                          key: res.objectInfo!.key,
                          metadata: res.objectInfo!.metadata,
                          acl: res.objectInfo!.acl,
                          storageClass: res.objectInfo!.storageClass,
                          cacheControl: res.objectInfo!.cacheControl,
                        }) as BeforeUploadCallbackObjectInfo
                    : undefined;

              return {
                metadata: res.metadata,
                bucketName: res.bucketName,
                generateObjectInfo,
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
