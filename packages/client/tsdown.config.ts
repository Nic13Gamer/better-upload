import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/helpers/index.ts', 'src/internal-export.ts'],
  format: ['esm'],
  dts: true,
  outDir: 'dist',
  clean: true,
});
