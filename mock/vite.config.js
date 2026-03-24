import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Auth routes → C# API (FinalProjectAuthAPI)
      '/api/auth': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false
      },
      // All other API routes → mock Node/Express server
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
