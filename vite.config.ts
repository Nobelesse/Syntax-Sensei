import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'node:path';

export default defineConfig({
  root: path.resolve(__dirname, 'webview'),
  base: './',
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, 'dist/webview'),
    emptyOutDir: true,
    assetsDir: 'assets',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/chunk-[name].js',
        assetFileNames: (asset) => asset.name?.endsWith('.css') ? 'assets/app.css' : 'assets/[name][extname]'
      }
    }
  }
});
