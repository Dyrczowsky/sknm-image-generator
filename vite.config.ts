/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  build: {
    // Wyłączone inline'owanie małych assetów jako data: URI - html-to-image
    // (eksport plakatu do PNG) zawiesza się na obrazkach osadzonych w ten
    // sposób. Wszystkie obrazy trafiają więc do osobnych, cache'owalnych plików.
    assetsInlineLimit: 0,
  },
  // Hosting: Cloudflare, aplikacja pod korzeniem domeny.
  base: '/',
  define: {
    __APP_VERSION__: JSON.stringify((process.env.CF_PAGES_COMMIT_SHA ?? process.env.WORKERS_CI_COMMIT_SHA ?? process.env.GITHUB_SHA ?? '').slice(0, 7) || 'dev'),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Rejestracja ręczna w src/main.tsx (pomijana na stronie /render dla API).
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Generator obrazów SKNM',
        short_name: 'SKNM Generator',
        description: 'Generator grafik wydarzeń na podstawie szablonów.',
        theme_color: '#2563eb',
        background_color: '#121417',
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
    include: ['src/**/*.test.ts', 'api/**/*.test.ts'],
    // Biblioteka OAuth Workera importuje `cloudflare:workers` (tylko w workerd); w Node podstawiamy atrapę.
    alias: { 'cloudflare:workers': new URL('./api/test/cloudflare-workers.ts', import.meta.url).pathname },
    server: { deps: { inline: ['@cloudflare/workers-oauth-provider'] } },
  },
})
