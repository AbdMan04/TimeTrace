import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev/build source lives in src/ (entry: src/index.html). The root
// index.html is the committed single-file build that branch-mode GitHub
// Pages serves directly.
// base './' keeps assets relative so builds deploy under any sub-path.
export default defineConfig({
  root: 'src',
  plugins: [react()],
  base: './',
  build: {
    outDir: '../dist',
  },
});