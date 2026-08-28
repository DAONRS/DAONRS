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
    strictPort: true,    
    allowedHosts: true 
  },
  // 📌 아래 최적화 설정을 추가해 주세요
  optimizeDeps: {
    include: ['react-pageflip', 'react', 'react-dom'],
  }
})