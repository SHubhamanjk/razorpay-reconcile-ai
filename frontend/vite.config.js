import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'fix-mime-types',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || '';
          if (/\.(js|jsx|mjs|ts|tsx)(\?.*)?$/.test(url) || url.includes('/@vite/') || url.includes('/@react-refresh')) {
            res.setHeader('Content-Type', 'application/javascript');
          } else if (/\.css(\?.*)?$/.test(url)) {
            res.setHeader('Content-Type', 'text/css');
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 5173,
    proxy: {
      '/reconcile': 'http://127.0.0.1:8000',
      '/evaluate-benchmark': 'http://127.0.0.1:8000',
      '/health': 'http://127.0.0.1:8000',
      '/ai': 'http://127.0.0.1:8000',
    },
  },
});

