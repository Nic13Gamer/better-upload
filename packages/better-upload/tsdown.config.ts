import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    'src/server/index.ts',
    'src/server-helpers/index.ts',
    'src/client/index.ts',
    'src/client-helpers/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  outDir: 'dist',
  clean: true,
});
