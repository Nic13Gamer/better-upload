import { source } from '@/lib/source';
import { MetadataRoute } from 'next';

export const revalidate = false;

const baseUrl =
  process.env.NODE_ENV === 'development' ||
  !process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? new URL('http://localhost:3000')
    : new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);

const url = (path: string): string => new URL(path, baseUrl).toString();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    ...(await Promise.all(
      source.getPages().map(async (page) => {
        const priority = page.url === '/' ? 1 : 0.5;

        return {
          url: url(page.url),
          changeFrequency: 'weekly',
          priority,
        } as MetadataRoute.Sitemap[number];
      })
    )),
  ];
}
