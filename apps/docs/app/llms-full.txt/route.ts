import { getLlmText } from '@/lib/get-llm-text';
import { source } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  const scan = source.getPages().map(getLlmText);
  const scanned = await Promise.all(scan);

  return new Response(scanned.join('\n\n'));
}
