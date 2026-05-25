import type { Client } from '@/types/router/internal';
import { getBodyContentLength, sha256, throwS3Error } from '@/utils/s3';
import { SafeXml } from './xml';

export function defineHelper<
  P extends { bucket: string },
  E = {},
  T = void,
>(opts: {
  method: string;

  url: (params: P) => {
    url: string;
    searchParams?: Record<string, string | number | undefined>;
  };
  headers?: (params: P) => Record<string, string | undefined>;

  execute?: {
    buildBody?: (params: P & E) => SafeXml | BodyInit;
    xmlChecksumHeader?: boolean;
    checkOkResponse?: boolean;
    parseData?: (response: Response) => T | Promise<T>;
  };
}) {
  const buildUrl = (client: Client, params: P) => {
    const spec = opts.url(params);
    const url = new URL(`${client.buildBucketUrl(params.bucket)}${spec.url}`);

    if (spec.searchParams) {
      for (const [key, value] of Object.entries(spec.searchParams)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }

    return url;
  };

  const buildHeaders = (params: P) => {
    return (
      opts.headers
        ? Object.fromEntries(
            Object.entries(opts.headers(params)).filter(
              ([_, value]) => value !== undefined
            )
          )
        : {}
    ) as Record<string, string>;
  };

  return {
    async presign(
      client: Client,
      params: P & {
        /**
         * Expiration time in seconds for the pre-signed URL.
         *
         * @default 900 // 15 minutes
         */
        expiresIn?: number;
      }
    ) {
      const url = buildUrl(client, params);
      url.searchParams.set('X-Amz-Expires', String(params.expiresIn ?? 900));

      const headers = buildHeaders(params);

      const { url: signed } = await client.s3.sign(url.toString(), {
        method: opts.method,
        headers,
        aws: { signQuery: true, allHeaders: true },
      });

      return { url: signed, headers };
    },

    async execute(client: Client, params: P & E): Promise<T> {
      const url = buildUrl(client, params);
      const headers = buildHeaders(params);

      let body: BodyInit | undefined;
      let isXmlBody = false;
      if (opts.execute?.buildBody) {
        const built = opts.execute.buildBody(params);

        if (built instanceof SafeXml) {
          body = built.toString();
          isXmlBody = true;
          if (!headers['content-type']) {
            headers['content-type'] = 'application/xml';
          }
        } else {
          body = built;
        }

        if (!headers['content-length']) {
          const len = getBodyContentLength(body);
          if (len !== null) headers['content-length'] = len.toString();
        }

        if (isXmlBody && opts.execute.xmlChecksumHeader) {
          headers['x-amz-checksum-sha256'] = await sha256(body as string);
        }
      }

      const res = await throwS3Error(
        client.s3.fetch(url.toString(), {
          method: opts.method,
          headers,
          body,
          aws: { signQuery: true, allHeaders: true },
        }),
        { checkOk: opts.execute?.checkOkResponse ?? false }
      );

      if (opts.execute?.parseData) return opts.execute.parseData(res);
      return undefined as T;
    },
  };
}
