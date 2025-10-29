import '@/app/global.css';
import { Toaster } from '@/components/ui/sonner';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { Metadata } from 'next';
import { Geist } from 'next/font/google';
import type { ReactNode } from 'react';

const fontSans = Geist({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Better Upload',
    default: 'Better Upload',
  },
  description:
    'The simple and bloat-free way to upload files in React. Upload directly to any S3-compatible service with minimal setup.',
  keywords: [
    'nextjs',
    'next',
    'file upload',
    'upload component',
    'better-upload',
    'typescript',
    'react',
    'react upload',
    'tanstack',
  ],
  metadataBase: new URL('https://better-upload.com'),
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontSans.className} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider search={{ options: { type: 'static' } }}>
          {children}
        </RootProvider>

        <Toaster />
      </body>
    </html>
  );
}
