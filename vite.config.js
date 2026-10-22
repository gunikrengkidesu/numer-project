import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  plugins: [vue()],
  server: { proxy: { '/api': 'http://localhost:3000' } } // ตอน dev ส่ง /api ไปที่ Express
})
