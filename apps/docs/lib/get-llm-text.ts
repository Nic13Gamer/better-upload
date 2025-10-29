import { InferPageType } from 'fumadocs-core/source';
import { source } from './source';

export async function getLlmText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}
