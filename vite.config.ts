import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          name: 'Thuyết Minh Tự Động Việt Nam Quốc Tự',
          short_name: 'VNQT Thuyết Minh',
          description: 'Hệ thống thuyết minh tự động đa ngôn ngữ, định vị GPS khuôn viên và chiêm bái di tích Việt Nam Quốc Tự.',
          theme_color: '#2d5a37',
          background_color: '#f7f9f6',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          globIgnores: ['**/maplibre-gl-worker-dev.mjs', '**/audio/**'],
          runtimeCaching: [
            // 1. Caching file âm thanh thuyết minh (MP3 / WAV) - CacheFirst
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/audio/') || url.pathname.endsWith('.mp3'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'vnqt-audio-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 ngày
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // 2. Caching hình ảnh di tích và tư liệu chiêm bái - CacheFirst
            {
              urlPattern: ({ url, request }) =>
                request.destination === 'image' ||
                url.pathname.startsWith('/uploads/') ||
                url.pathname.startsWith('/assets/') ||
                /\.(?:png|jpg|jpeg|svg|webp)$/i.test(url.pathname),
              handler: 'CacheFirst',
              options: {
                cacheName: 'vnqt-images-cache',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 ngày
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // 3. Caching API danh sách điểm chiêm bái - NetworkFirst với timeout 3s
            {
              urlPattern: ({ url }) => url.pathname === '/api/pois' || url.pathname === '/api/campus',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'vnqt-api-pois-cache',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 24 * 60 * 60, // 24 giờ
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
