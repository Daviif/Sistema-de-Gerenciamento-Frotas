import path from "path" // Import necessário para o alias
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Agora o nome será reconhecido
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Configura o alias para o Vite
    },
  },
})