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
      injectRegister: null,
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      registerType: 'autoUpdate',

      injectManifest: {
        // ✅ این دقیقاً همون چیزیه که پرسیدی. باید این باشه تا لیست فایل‌ها رو به sw.js بده
        injectionPoint: 'self.__WB_MANIFEST',
        swDest: 'dist/sw.js'
      },

      // ⚠️ منبع یگانه‌ی حقیقت برای manifest، فایل‌های استاتیک زیر public/ هستند:
      //    public/manifest.webmanifest (اپ کاربر) و public/admin-manifest.webmanifest (پنل مدیریت).
      //    اگر این false نباشد، پلاگین dist/manifest.webmanifest را بازنویسی می‌کند و
      //    یک تگ <link rel="manifest"> تکراری هم به HTML تزریق می‌کند.
      manifest: false,
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        // هر اپ نصب‌شدنی سند ورودی خودش را دارد تا هویت PWA ثابت بماند
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        en: fileURLToPath(new URL('./en.html', import.meta.url)),
        admin: fileURLToPath(new URL('./admin.html', import.meta.url)),
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
