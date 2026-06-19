import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Ganti '/sansantcgdashboard/' dengan nama repo GitHub kamu jika berbeda.
// Jika repo ini adalah <username>.github.io, gunakan base: '/'
export default defineConfig({
  plugins: [react()],
  base: '/timroket/',
})
