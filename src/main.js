import './assets/main.css'
import './assets/fonts-shabnam.css';
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { registerWebPush } from '@/utils/webpush'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('Service Worker registered ✅'))
    .catch(err => console.error('SW registration failed:', err))
}

// registerWebPush()


