import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'force-correct-mime-types',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const originalSetHeader = res.setHeader.bind(res);
          const originalWriteHead = res.writeHead.bind(res);

          const getCorrectMime = (url = '') => {
            const cleanUrl = url.split('?')[0].split('#')[0];
            if (/\.css$/i.test(cleanUrl)) return 'text/css; charset=utf-8';
            if (/\.(js|jsx|mjs|cjs|ts|tsx)$/i.test(cleanUrl) || url.includes('/@vite/') || url.includes('/@react-refresh')) {
              return 'application/javascript; charset=utf-8';
            }
            if (/\.svg$/i.test(cleanUrl)) return 'image/svg+xml';
            if (/\.json$/i.test(cleanUrl)) return 'application/json; charset=utf-8';
            return null;
          };

          res.setHeader = (name, value) => {
            if (typeof name === 'string' && name.toLowerCase() === 'content-type') {
              const mime = getCorrectMime(req.url);
              if (mime) return originalSetHeader('Content-Type', mime);
            }
            return originalSetHeader(name, value);
          };

          res.writeHead = (statusCode, ...args) => {
            const mime = getCorrectMime(req.url);
            if (mime) {
              res.setHeader('Content-Type', mime);
            }
            return originalWriteHead(statusCode, ...args);
          };

          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          const originalSetHeader = res.setHeader.bind(res);
          const originalWriteHead = res.writeHead.bind(res);

          const getCorrectMime = (url = '') => {
            const cleanUrl = url.split('?')[0].split('#')[0];
            if (/\.css$/i.test(cleanUrl)) return 'text/css; charset=utf-8';
            if (/\.(js|jsx|mjs|cjs|ts|tsx)$/i.test(cleanUrl)) return 'application/javascript; charset=utf-8';
            if (/\.svg$/i.test(cleanUrl)) return 'image/svg+xml';
            if (/\.json$/i.test(cleanUrl)) return 'application/json; charset=utf-8';
            return null;
          };

          res.setHeader = (name, value) => {
            if (typeof name === 'string' && name.toLowerCase() === 'content-type') {
              const mime = getCorrectMime(req.url);
              if (mime) return originalSetHeader('Content-Type', mime);
            }
            return originalSetHeader(name, value);
          };

          res.writeHead = (statusCode, ...args) => {
            const mime = getCorrectMime(req.url);
            if (mime) {
              res.setHeader('Content-Type', mime);
            }
            return originalWriteHead(statusCode, ...args);
          };

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


