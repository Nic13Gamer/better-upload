import { createMDX } from 'fumadocs-mdx/next';
import type { NextConfig } from 'next';

const withMDX = createMDX();

const config: NextConfig = {
  reactStrictMode: true,
  output: process.env.NODE_ENV === 'development' ? undefined : 'export',
};

export default withMDX(config);
