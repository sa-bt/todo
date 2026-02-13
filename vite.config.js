import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  define: {
    // 💡 این مقدار برای Cache Busting توی سرویس ورکر استفاده میشه
    'self.BUILD_HASH': JSON.stringify(Date.now().toString()),
  },

  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      registerType: 'autoUpdate',

      injectManifest: {
        // ✅ این دقیقاً همون چیزیه که پرسیدی. باید این باشه تا لیست فایل‌ها رو به sw.js بده
        injectionPoint: 'self.__WB_MANIFEST',
        swDest: 'dist/sw.js'
      },

      manifest: {
        name: 'Do It',
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
    purpose: 'any' // آیکون معمولی
  },
  {
    src: '/pwa-512x512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'any' // برای مچ شدن با لانچرهای مختلف گوشی
  },
  {
    src: '/pwa-badge.png', // آدرس فایل بج که ساختی
    sizes: '96x96',
    type: 'image/png',
    purpose: 'monochrome' // 👈 این خیلی مهمه! به سیستم می‌گه این تک‌رنگه
  }
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
