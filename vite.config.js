import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api/db': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/db/, ''),
      },
      '/api/honeypot': {
        target: 'http://127.0.0.1:8082',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/honeypot/, ''),
      },
      '/api/p3': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/p3/, ''),
      },
    },
  },
})
