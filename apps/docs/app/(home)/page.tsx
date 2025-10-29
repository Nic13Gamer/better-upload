import { UploadDropzoneDemo } from '@/components/templates/upload-dropzone-demo';
import { Button } from '@/components/ui/button';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Files, PencilRulerIcon, Zap } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import ClientCode from './code/client.mdx';
import ServerCode from './code/server.mdx';

export const metadata: Metadata = {
  title: {
    absolute: 'Better Upload - Simple and easy file uploads for React',
  },
};

export default function HomePage() {
  return (
    <main className="container mb-16 lg:px-20">
      <div className="mt-24 flex flex-col items-center justify-between gap-16 sm:mt-32 md:mt-36 lg:mt-16 lg:flex-row">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold md:text-5xl lg:text-6xl">
            Better Upload
          </h1>
          <h2 className="text-fd-muted-foreground max-w-md text-balance sm:text-lg md:max-w-xl md:text-xl">
            Simple and easy file uploads for React. Upload directly to any
            S3-compatible service with minimal setup.
          </h2>

          <div className="mt-8 flex gap-2 lg:mt-12">
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
            <div className="py-6">
              <UploadDropzoneDemo />
            </div>

            <Tabs items={['Client', 'Server']} className="my-0 w-full">
              <Tab value="Client">
                <CodeBlock>
                  <Pre>
                    <ClientCode />
                  </Pre>
                </CodeBlock>
              </Tab>
              <Tab value="Server">
                <CodeBlock>
                  <Pre>
                    <ServerCode />
                  </Pre>
                </CodeBlock>
              </Tab>
            </Tabs>
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
