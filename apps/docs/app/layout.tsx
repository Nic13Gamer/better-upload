import { Analytics } from '@vercel/analytics/react';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { RootProvider } from 'fumadocs-ui/provider';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import './global.css';
import { baseOptions } from './layout.config';
import { source } from './source';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Better Upload',
    default: 'better-upload',
  },
  description: 'Simple file uploads for React',
  keywords: [
    'nextjs',
    'next',
    'file upload',
    'uploads',
    'better-upload',
    'typescript',
    'react',
  ],
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body>
        <RootProvider>
          <DocsLayout tree={source.pageTree} {...baseOptions}>
            {children}
          </DocsLayout>
        </RootProvider>

        <Analytics />
      </body>
    </html>
  );
}
