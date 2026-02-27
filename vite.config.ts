import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
    return {
      server: {
        // Bind dev server to a fixed port so the app is reachable where expected
        // Port changed to 4002 to avoid conflicts on common developer machines
        port: 4002,
        strictPort: true,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:8788',
            changeOrigin: true,
          },
        },
      },
      plugins: [react(), tailwind(), tsconfigPaths()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      }
      ,
      build: {
        // Keep warning threshold relaxed while relying on Vite's default chunk strategy.
        chunkSizeWarningLimit: 800,
      }
    };
});
