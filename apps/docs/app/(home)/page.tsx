import { UploadDropzoneDemo } from '@/components/templates/upload-dropzone-demo';
import { Button } from '@/components/ui/button';
import { getMDXComponents } from '@/mdx-components';
import { Files, PencilRulerIcon, Zap } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import Codeblock from './codeblock.mdx';

export const metadata: Metadata = {
  title: {
    absolute: 'Better Upload - Simple and easy file uploads for React',
  },
};

export default function HomePage() {
  return (
    <main className="container mb-16 lg:px-20">
      <div className="lg:mt-18 mt-24 flex flex-col items-center justify-between gap-16 sm:mt-32 md:mt-36 lg:flex-row">
        <div className="grid gap-4">
          <a
            href="https://www.producthunt.com/products/better-upload?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-better&#0045;upload"
            target="_blank"
            className="w-[230px]"
          >
            <img
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1040966&theme=light&t=1763758544269"
              alt="Better&#0032;Upload - Simple&#0032;and&#0032;easy&#0032;file&#0032;uploads&#0032;for&#0032;React&#0044;&#0032;use&#0032;your&#0032;S3&#0032;bucket | Product Hunt"
            />
          </a>

          <h1 className="text-4xl font-bold md:text-5xl lg:text-6xl">
            Better Upload
          </h1>
          <h2 className="text-fd-muted-foreground max-w-md text-balance sm:text-lg md:max-w-xl md:text-xl">
            Simple and easy file uploads for React. Upload directly to any
            S3-compatible service with minimal setup.
          </h2>

          <div className="mt-4 flex gap-2 lg:mt-8">
            <Button size="lg" asChild>
              <Link href="/docs/quickstart">Get Started</Link>
            </Button>
            <Button size="lg" variant="link" asChild>
              <Link
                href="https://github.com/Nic13Gamer/better-upload"
                target="_blank"
              >
                View on GitHub
              </Link>
            </Button>
          </div>
        </div>

        <div className="h-[601px] w-full max-w-lg">
          <div className="border-fd-border flex flex-col items-center rounded-xl border border-dashed">
            <div className="py-7">
              <UploadDropzoneDemo />
            </div>

            <div className="w-full *:my-0">
              <Codeblock components={getMDXComponents()} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-28 grid grid-cols-1 gap-16 lg:mt-44 lg:grid-cols-3">
        {[
          {
            icon: Zap,
            title: 'Easy to use',
            description:
              'It takes only a few minutes to get started and upload files directly to your S3 bucket.',
          },
          {
            icon: PencilRulerIcon,
            title: 'Beautiful',
            description:
              'Use copy-and-paste shadcn/ui components to rapidly build your UI.',
          },
          {
            icon: Files,
            title: 'Own your data',
            description:
              'Upload directly to your S3 bucket, so you have full control over files.',
          },
        ].map((item, idx) => (
          <div
            className="bg-fd-muted/70 dark:bg-fd-muted/15 rounded-xl border p-6"
            key={idx}
          >
            <item.icon className="text-fd-muted-foreground size-7" />
            <p className="mt-5 text-lg font-medium">{item.title}</p>
            <p className="text-fd-muted-foreground mt-1.5 text-balance">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
