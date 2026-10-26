import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['data/*.json'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,woff2,webp}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/data\//, /^\/audio\//],
      },
      manifest: {
        name: 'Value Structuring Engine',
        short_name: 'VSE',
        description: 'A whole place, saying what it needs.',
        theme_color: '#155E6E',
        background_color: '#FAF7F2',
        display: 'standalone',
        icons: [],
      },
    }),
  ],
})
