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

app.mount('#app')

// 🌟 بخش به‌روزرسانی‌شده: ثبت Service Worker، مدیریت به‌روزرسانی و ثبت Web Push
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' })

    .then(registration => {
      console.log('✅ Service Worker registered with scope:', registration.scope)

      // 💡 مرحله ۱: ذخیره registration (اختیاری، اما مفید)
      app.config.globalProperties.$swRegistration = registration;
      
      // 💡 مرحله ۲: فراخوانی registerWebPush پس از اطمینان از ثبت Worker
      // (registerWebPush باید شیء registration را به عنوان پارامتر بپذیرد)
      registerWebPush(registration);

      // 🌟 اضافه کردن منطق پیگیری به‌روزرسانی (UpdateFound)
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                
                // 💡 به جای confirm()، ارسال Custom Event به UI (کامپوننت‌های Vue)
                console.log('🔄 New content ready to be activated. Dispatching event to UI...');
                
                // ایجاد یک رویداد سفارشی برای اطلاع‌رسانی به UI
                const event = new CustomEvent('swUpdateAvailable', {
                    detail: { newWorker: newWorker } // ارجاع به New Worker را برای فعال‌سازی حمل می‌کنیم
                });
                window.dispatchEvent(event);
            }
          })
        }
      })
    })
    .catch(error => {
      console.error('❌ Service Worker registration failed:', error)
    })
}