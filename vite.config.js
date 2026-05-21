import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { readFileSync } from 'fs';
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig(({ command }) => ({
  plugins: [
    react(),

    // HTTPS auto-signed cert — só em dev, para instalar no celular pela rede local
    command === 'serve' && basicSsl(),

    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],

      manifest: {
        name: 'FabricaLog',
        short_name: 'FabricaLog',
        description: 'Controle de produção — Forno CEDAN',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#1c1715',
        theme_color: '#1c1715',
        lang: 'pt-BR',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },

      workbox: {
        // Cache tudo que o app precisa para rodar offline
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [],
        cleanupOutdatedCaches: true,
      },

      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),

  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },

  server: {
    host: true,   // expõe para a rede local (0.0.0.0)
    port: 5173,
  },
}));
