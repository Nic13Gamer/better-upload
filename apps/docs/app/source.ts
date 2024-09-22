import { docs, meta } from '@/.source';
import { create } from '@/components/ui/icon';
import { loader } from 'fumadocs-core/source';
import { createMDXSource } from 'fumadocs-mdx';
import { icons } from 'lucide-react';

export const source = loader({
  baseUrl: '/',
  source: createMDXSource(docs, meta),
  icon(icon) {
    if (icon && icon in icons) {
      return create({ icon: icons[icon as keyof typeof icons] });
    }
  },
});
