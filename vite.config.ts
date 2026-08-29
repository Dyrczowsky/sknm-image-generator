/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  build: {
    // Wyłączone inline'owanie małych assetów jako data: URI - html-to-image
    // (eksport plakatu do PNG) zawiesza się na obrazkach osadzonych w ten
    // sposób. Wszystkie obrazy trafiają więc do osobnych, cache'owalnych plików.
    assetsInlineLimit: 0,
  },
  base: "/sknm-image-generator/",
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Generator obrazów SKNM',
        short_name: 'SKNM Generator',
        description: 'Generator grafik wydarzeń na podstawie szablonów.',
        theme_color: '#2563eb',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,wasm,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
