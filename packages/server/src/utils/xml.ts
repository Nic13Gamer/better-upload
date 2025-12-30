import { XMLParser } from 'fast-xml-parser';

export function parseXml<T = Record<string, any>>(
  xml: string,
  params?: {
    ignoreAttributes?: boolean;
    array?: boolean;
  }
): T {
  const parser = new XMLParser({
    ignoreAttributes: params?.ignoreAttributes ?? true,
    isArray: () => params?.array ?? false,
  });
  return parser.parse(xml) as T;
}
