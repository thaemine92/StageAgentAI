import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Externaliser les modules natifs et Node.js pour éviter les erreurs dans le navigateur
  build: {
    rollupOptions: {
      external: [
        'sqlite3', 
        'bcrypt', 
        '@mapbox/node-pre-gyp',
        'path',
        'fs',
        'crypto',
        'sqlite',
        'child_process',
        'util'
      ],
    },
  },
  // Configurer le proxy pour l'API en développement
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  // Définir les variables globales pour le navigateur
  define: {
    global: {},
    'process.env': {},
  },
})