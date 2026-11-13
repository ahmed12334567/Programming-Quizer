import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static hosting friendly configuration:
// Using './' allows deploying to root (Vercel/Netlify) or any GitHub Pages subpath.
// Combine with HashRouter so refreshing any route (/quiz, /admin, etc.) never 404s.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
