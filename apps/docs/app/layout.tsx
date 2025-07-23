import { source } from '@/lib/source';
import { Banner } from 'fumadocs-ui/components/banner';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { RootProvider } from 'fumadocs-ui/provider';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { baseOptions } from './layout.config';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import './global.css';

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
        <Banner className="text-fd-muted-foreground gap-2">
          You are viewing the docs for version 0.{' '}
          <Link
            href="https://better-upload.com"
            className="text-fd-foreground flex items-center gap-1.5 underline"
          >
            Switch to latest
            <ArrowRight className="size-3.5" />
          </Link>
        </Banner>

        <RootProvider search={{ options: { type: 'static' } }}>
          <DocsLayout tree={source.pageTree} {...baseOptions}>
            {children}
          </DocsLayout>
        </RootProvider>
      </body>
    </html>
  );
}
