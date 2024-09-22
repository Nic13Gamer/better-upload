import { DocsLayout } from 'fumadocs-ui/layout';
import { RootProvider } from 'fumadocs-ui/provider';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import './global.css';
import { baseOptions } from './layout.config';
import { source } from './source';

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body>
        <RootProvider>
          <DocsLayout tree={source.pageTree} {...baseOptions}>
            {children}
          </DocsLayout>
        </RootProvider>
      </body>
    </html>
  );
}
