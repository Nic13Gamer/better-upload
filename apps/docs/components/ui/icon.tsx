import { LucideIcon } from 'lucide-react';

export function create({ icon: Icon }: { icon?: LucideIcon }) {
  return (
    <div className="bg-fd-muted rounded-md border p-1 shadow-sm">
      {Icon && <Icon />}
    </div>
  );
}
