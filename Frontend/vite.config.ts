import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // forward api calls to the backend during local dev
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
