import { docs } from '@/.source';
import { create } from '@/components/ui/icon';
import { loader } from 'fumadocs-core/source';
import { icons } from 'lucide-react';

export const source = loader({
  baseUrl: '/',
  source: docs.toFumadocsSource(),
  icon(icon) {
    if (!icon) {
      return;
    }

    if (icon in icons) {
      return create({ icon: icons[icon as keyof typeof icons] });
    }
  },
});
