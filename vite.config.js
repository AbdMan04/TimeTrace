import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps assets relative so the build deploys on GitHub Pages
// (and any sub-path) without configuration.
export default defineConfig({
  plugins: [react()],
  base: './',
});