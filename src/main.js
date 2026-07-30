import './assets/main.css'
import './assets/fonts-shabnam.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import { createI18n } from 'vue-i18n'
import fa from './locales/fa.json'
import en from './locales/en.json'
import { syncPwaManifest } from '@/utils/pwaManifest'

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('lang') || 'fa',
  fallbackLocale: 'en',
  messages: { fa, en },
})


import { registerWebPush } from '@/utils/webpush'
import { setupServiceWorker } from '@/utils/swUpdate'

const app = createApp(App)
app.use(createPinia())
app.use(i18n)
app.use(router)

syncPwaManifest()
router.afterEach((to) => {
  syncPwaManifest(to.path)
})

app.mount('#app')

// 🌟 ثبت Service Worker، مدیریت به‌روزرسانی و ثبت Web Push
setupServiceWorker().then((registration) => {
  if (!registration) return

  app.config.globalProperties.$swRegistration = registration
  registerWebPush(registration)
})
