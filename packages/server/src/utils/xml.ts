import { XMLParser } from 'fast-xml-parser';

const XML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

class SafeXml {
  constructor(readonly value: string) {}
  toString() {
    return this.value;
  }
}

function escapeValue(value: unknown): string {
  if (value instanceof SafeXml) return value.value;
  if (Array.isArray(value)) return value.map(escapeValue).join('');

  return String(value)
    .replace(/\x00/g, '')
    .replace(/[&<>"']/g, (c) => XML_ESCAPE[c]!);
}

export function xml(strings: TemplateStringsArray, ...values: unknown[]) {
  const result = strings.reduce((acc, str, i) => {
    return i < values.length ? acc + str + escapeValue(values[i]) : acc + str;
  }, '');

  return new SafeXml(result);
}

export function parseXml<T = Record<string, any>>(
  xml: string,
  params?: {
    ignoreAttributes?: boolean;
    arrayPath?: string[];
  }
): T {
  const parser = new XMLParser({
    jPath: true,
    ignoreAttributes: params?.ignoreAttributes ?? true,
    isArray: (_, path) => params?.arrayPath?.includes(path as string) ?? false,
  });
  return parser.parse(xml) as T;
}
