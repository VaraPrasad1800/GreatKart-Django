import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/media': 'http://127.0.0.1:8000',
      '/category/api': 'http://127.0.0.1:8000',
      '/store/api': 'http://127.0.0.1:8000',
      '/cart/api': 'http://127.0.0.1:8000',
      '/orders/api': 'http://127.0.0.1:8000',
      '/accounts/api': 'http://127.0.0.1:8000',
      '/wishlist/api': 'http://127.0.0.1:8000',
    }
  }
})
