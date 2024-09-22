import type { LucideIcon } from 'lucide-react';
import { TerminalIcon } from 'lucide-react';

export function create({
  icon: Icon,
}: {
  icon?: LucideIcon;
}): React.ReactElement {
  return (
    <div className="from-fd-secondary rounded-md border bg-gradient-to-b p-1 shadow-sm">
      {Icon ? <Icon /> : <TerminalIcon />}
    </div>
  );
}
