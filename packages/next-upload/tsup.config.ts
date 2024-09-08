import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server/index.ts', 'src/client/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  outDir: 'dist',
  clean: true,
});
