import { XMLParser } from 'fast-xml-parser';

export function parseXml<T = Record<string, any>>(
  xml: string,
  params?: {
    ignoreAttributes?: boolean;
  }
): T {
  const parser = new XMLParser({
    ignoreAttributes: params?.ignoreAttributes ?? true,
  });
  return parser.parse(xml) as T;
}
