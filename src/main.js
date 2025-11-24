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

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}

registerWebPush()
