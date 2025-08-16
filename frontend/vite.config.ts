import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
     port: 3000,
    proxy: {
      '/auth': 'https://macaw-deciding-hermit.ngrok-free.app',
      '/dashboard': 'https://macaw-deciding-hermit.ngrok-free.app',
      '/statements': 'https://macaw-deciding-hermit.ngrok-free.app',
      '/payments': 'https://macaw-deciding-hermit.ngrok-free.app',
      '/stripe': 'https://macaw-deciding-hermit.ngrok-free.app',
      '/user': 'https://macaw-deciding-hermit.ngrok-free.app'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})