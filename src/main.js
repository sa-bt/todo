import './assets/main.css'
import './assets/fonts-shabnam.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import { createI18n } from 'vue-i18n'
import fa from './locales/fa.json'
import en from './locales/en.json'

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('lang') || 'fa',
  fallbackLocale: 'en',
  messages: { fa, en },
})


import { registerWebPush } from '@/utils/webpush'

const app = createApp(App)
app.use(createPinia())
app.use(i18n)
app.use(router)

// 💡 نکته: اپلیکیشن را قبل از ثبت Service Worker Mount کن
app.mount('#app')

// 🌟 بخش بهبود یافته: ثبت Service Worker و مدیریت به‌روزرسانی
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' }) // 👈 تعریف scope

    .then(registration => {
      console.log('✅ Service Worker registered with scope:', registration.scope)

      // 🌟 اضافه کردن منطق پیگیری به‌روزرسانی برای PWA
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // یعنی نسخه جدید دانلود شده و آماده فعال‌سازی است.
                console.log('🔄 New content available. User must close all tabs or refresh twice.');
                
                // 💡 پیشنهاد: یک Toast یا Modal به کاربر نشان بدهید که "بروزرسانی جدید در دسترس است. برای فعال‌سازی رفرش کنید."
                // برای فعال‌سازی فوری بدون بستن تب:
                // newWorker.postMessage({ action: 'skipWaiting' });
            }
          })
        }
      })
    })
    .catch(error => {
      console.error('❌ Service Worker registration failed:', error)
    })
}

registerWebPush()