import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor';
            return 'deps';
          }
          if (id.includes('portals/hospital-admin')) {
            return 'portal-hospital-admin';
          }
          if (id.includes('portals/super-admin')) {
            return 'portal-super-admin';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
});
