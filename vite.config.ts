import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    open: true, 
    strictPort: false, // 🚀 THIS IS THE FIX. Forces Vite to ignore zombie locks and skip to 5174, 5175, etc.
  },
});
