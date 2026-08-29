import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Single-file build: JS + CSS are inlined into index.html so the app can be
// opened straight from disk (double-click) without a web server.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  define: {
    // plugin inspects bundle; nothing to inject, kept minimal
  },
  build: {
    outDir: 'dist-single',
  },
});