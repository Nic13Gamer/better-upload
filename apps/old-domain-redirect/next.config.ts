import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === 'development' ? undefined : 'export',
};

export default nextConfig;
