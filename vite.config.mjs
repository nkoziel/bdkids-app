import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/*
 * Same product promise as rayon-app: one file you can just open, no server. src/ builds to a
 * single self-contained index.html, which tools/publish.js copies to the repo root for GitHub
 * Pages and for cloning + double-clicking without a build step.
 *
 * PWA files (manifest, service worker, icons) stay at the repo root, outside the bundle.
 */
export default defineConfig({
  root: 'src',
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    minify: false,
    rollupOptions: {
      external: [/^\.\/icons\//, /manifest\.webmanifest$/, /sw\.js$/],
    },
  },
  plugins: [viteSingleFile()],
});
