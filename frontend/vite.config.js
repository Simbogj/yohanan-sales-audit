import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Serve index.html for every non-asset request so React Router
    // handles the route instead of Vite returning a real 404.
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    // Same fallback for `vite preview` (production preview)
    historyApiFallback: true,
    port: 5173,
  },
  build: {
    // Emit a _redirects file for Netlify / any static host that reads it
    rollupOptions: {},
  },
});
