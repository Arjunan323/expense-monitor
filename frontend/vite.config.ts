import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
     port: 3000,
    proxy: {
      '/auth': 'http://localhost:8080',
      '/dashboard': 'http://localhost:8080',
      '/statements': 'http://localhost:8080',
      '/payments': 'http://localhost:8080',
      '/stripe': 'http://localhost:8080',
      '/user': 'http://localhost:8080'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})