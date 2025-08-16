'use client';

import { cn } from '@/lib/utils';
import Link from 'fumadocs-core/link';
import { usePathname } from 'next/navigation';

type PageSelectProps = {
  pages: {
    href: string;
    title: string;
    description?: string;
  }[];
};

export function PageSelect({ pages }: PageSelectProps) {
  const pathname = usePathname();

  return (
    <div className="@container grid grid-cols-2 gap-4">
      {pages.map((page) => {
        const active = pathname === page.href;

        return (
          <Link
            key={page.href}
            href={page.href}
            data-card
            className={cn(
              'bg-fd-card/80 text-fd-card-foreground hover:bg-fd-accent/70 @max-lg:col-span-full block rounded-xl border p-4 shadow-md transition-colors',
              active &&
                'bg-fd-primary/10 border-fd-primary/70 hover:bg-fd-primary/10'
            )}
          >
            <h3 className="not-prose mb-1 text-sm font-medium">{page.title}</h3>

            {page.description ? (
              <p className="text-fd-muted-foreground mb-0 text-sm">
                {page.description}
              </p>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
