import Link from 'next/link';
import { Button } from './ui/button';

export function TocFooter() {
  return (
    <Link
      className="dark:bg-fd-card bg-fd-secondary text-fd-card-foreground group mt-4 flex w-full flex-col gap-2 rounded-xl p-6 text-sm"
      href="https://keyforge.dev"
      target="_blank"
    >
      <div className="text-balance text-base font-semibold leading-tight group-hover:underline">
        Need software licensing?
      </div>
      <div className="text-muted-foreground">
        Simple licensing for software, easily distribute your product.
      </div>
      <ul className="text-muted-foreground">
        <li>- payment automation</li>
        <li>- customer portal</li>
        <li>- offline licensing</li>
      </ul>
      <Button size="sm" className="pointer-events-none mt-2 w-min">
        Learn More
      </Button>
    </Link>
  );
}
