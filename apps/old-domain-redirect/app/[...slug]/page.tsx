import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Metadata } from 'next';
import Link from 'next/link';

export const dynamicParams = false;

export default async function Page(props: {
  params: Promise<{ slug: string[] }>;
}) {
  const params = await props.params;

  return (
    <main className="flex h-screen items-center justify-center">
      <Card className="w-96 text-center">
        <CardHeader>
          <CardTitle className="text-lg">
            The Better Upload docs have moved
          </CardTitle>
          <CardDescription>
            The Better Upload documentation has been moved to a new domain.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button className="w-full" asChild>
            <Link href="https://better-upload.com">Visit the new docs</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

export function generateStaticParams() {
  return [
    ['quickstart'],
    ['helpers'],
    ['routes'],
    ['hooks'],
    ['guide', 'form'],
    ['guides', 'tanstack-query'],
    ['components', 'upload-button'],
    ['components', 'upload-dropzone'],
    ['components', 'upload-dropzone-progress'],
  ].map((slug) => ({ slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string[] }>;
}) {
  const params = await props.params;

  return {
    alternates: {
      canonical: `https://better-upload.com/docs/${await params.slug.join('/')}`,
    },
  } satisfies Metadata;
}
