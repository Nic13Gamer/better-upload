import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/server/index.ts',
    'src/server-helpers/index.ts',
    'src/client/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  outDir: 'dist',
  clean: true,
});
