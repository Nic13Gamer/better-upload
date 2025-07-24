import { source } from '@/lib/source';
import { MetadataRoute } from 'next';

export const revalidate = false;

const baseUrl =
  process.env.NODE_ENV === 'development'
    ? new URL('http://localhost:3000')
    : new URL('https://better-upload.com');

const url = (path: string): string => new URL(path, baseUrl).toString();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: url('/'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...(await Promise.all(
      source.getPages().map(async (page) => {
        return {
          url: url(page.url),
          changeFrequency: 'weekly',
          priority: 0.9,
        } as MetadataRoute.Sitemap[number];
      })
    )),
  ];
}
