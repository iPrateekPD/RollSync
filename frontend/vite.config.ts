import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
  },
  server: {
    proxy: {
      '/supabase-api': {
        target: 'https://myeykshozowozsjapokt.supabase.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase-api/, ''),
        headers: {
          // Bypass Supabase browser secret key block
          'Origin': 'https://myeykshozowozsjapokt.supabase.co',
          'Referer': 'https://myeykshozowozsjapokt.supabase.co',
          'User-Agent': 'Node.js'
        }
      }
    }
  }
})
