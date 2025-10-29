import { XIcon } from '@/components/icons';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: 'Better Upload',
  },
  links: [
    {
      url: 'https://x.com/Nic13Gamer',
      text: 'X',
      type: 'icon',
      icon: (
        <div className="scale-85">
          <XIcon />
        </div>
      ),
      external: true,
    },
  ],
  githubUrl: 'https://github.com/Nic13Gamer/better-upload',
};
