import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

export default function Home() {
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
