import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools';
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // 💡 بخش تزریق Hash: برای Cache Busting اتوماتیک Service Worker
  define: {
    'self.BUILD_HASH': JSON.stringify(Date.now().toString()), 
  },
  
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    VitePWA({
      // ⚠️ تغییر حیاتی: استفاده از injectManifest برای Service Worker سفارشی
      registerType: 'injectManifest', 
      
      // 💡 مسیر دهی به فایل Service Worker سفارشی شما
      srcDir: 'public', // فرض بر این است که فایل اصلی شما در public قرار دارد
      filename: 'sw.js', // ✅ اصلاح نام فایل Service Worker
      
      manifest: {
        name: 'NPM Todo',
        short_name: 'Todo',
        description: 'مدیریت تسک‌ها و اهداف روزانه',
        theme_color: '#2563EB',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            // درخواست‌های API همیشه مستقیم از سرور
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
          {
            // کش کردن فایل‌های استاتیک (css/js/img)
            urlPattern: ({ request }) =>
              request.destination === 'style' ||
              request.destination === 'script' ||
              request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // یک هفته
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})