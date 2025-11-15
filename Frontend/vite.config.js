import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // --- AÑADE O ASEGÚRATE DE QUE ESTA LÍNEA EXISTA ---
  base: '/', 
  // ----------------------------------------------------
})