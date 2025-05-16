import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'es2023',
  outDir: 'dist',
  splitting: false,
  sourcemap: true,
  minify: false,
  bundle: true,
  skipNodeModulesBundle: true,
  esbuildOptions(options) {
    options.external = [];
  },
});
