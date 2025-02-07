import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[ext]'
      }
    },
    outDir: 'dist',
    assetsDir: '.',
    emptyOutDir: true,
    modulePreload: false,
    cssCodeSplit: false,
    sourcemap: false,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});