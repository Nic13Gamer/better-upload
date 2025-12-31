import { XMLParser } from 'fast-xml-parser';

export function parseXml<T = Record<string, any>>(
  xml: string,
  params?: {
    ignoreAttributes?: boolean;
    arrayPath?: string[];
  }
): T {
  const parser = new XMLParser({
    ignoreAttributes: params?.ignoreAttributes ?? true,
    isArray: (_, path) => params?.arrayPath?.includes(path) ?? false,
  });
  return parser.parse(xml) as T;
}
