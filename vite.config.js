import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './eurest_kiosk',
  publicDir: 'media',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsDir: 'assets'
  }
});
