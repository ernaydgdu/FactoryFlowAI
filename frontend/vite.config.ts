import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@tanstack')) return 'vendor-query'
            if (id.includes('react-router')) return 'vendor-router'
            if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react'
            return 'vendor'
          }
          if (id.includes('/src/domain/brain/')) return 'domain-brain'
          if (id.includes('/src/domain/enterprise/')) return 'domain-enterprise'
          if (id.includes('/src/domain/master-data/')) return 'domain-master-data'
          if (id.includes('/src/domain/')) return 'domain-core'
          if (id.includes('/src/application/')) return 'application'
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/api/, ''),
      },
    },
  },
})
