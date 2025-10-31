import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/clients/index.ts'],
  format: ['esm'],
  dts: true,
  outDir: 'dist',
  clean: true,
});
