import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        // Bind dev server to a fixed port so the app is reachable where expected
        port: 4001,
        strictPort: true,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwind()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
      ,
      build: {
        // Keep chunk sizes more ergonomic for initial download and allow explicit vendor splitting
        chunkSizeWarningLimit: 800,
        rollupOptions: {
          output: {
            manualChunks(id: string) {
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('scheduler') || id.includes('react-dom')) return 'react-vendor';
                if (id.includes('recharts') || id.includes('victory') || id.includes('d3-')) return 'charts-vendor';
                return 'vendor';
              }
            }
          }
        }
      }
    };
});
