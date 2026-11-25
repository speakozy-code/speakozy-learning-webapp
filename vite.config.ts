import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// One project, two pages:
//   /      -> marketing site (site/src, Tailwind, BrowserRouter)
//   /app/  -> student/admin app (src, hash router)
export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: { '@': path.resolve(__dirname, 'site/src') },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', '@tanstack/react-query', '@tanstack/query-core'],
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        site: path.resolve(__dirname, 'index.html'),
        app: path.resolve(__dirname, 'app/index.html'),
      },
    },
  },
});
