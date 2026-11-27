import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const serverTarget = env.VITE_SERVER_URL || 'http://127.0.0.1:5001';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: serverTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: serverTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
