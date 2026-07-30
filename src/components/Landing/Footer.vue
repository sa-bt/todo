<template>
  <footer class="py-12 text-center mt-20 border-t border-token">
    <div class="flex justify-center gap-4 mb-8">
      <a
        v-for="link in socialLinks"
        :key="link.label"
        :href="link.href"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="link.label"
        :style="{
          '--footer-hover-color': link.color,
          '--footer-hover-shadow': link.shadow,
        }"
        class="footer-social-link w-10 h-10 rounded-full border border-token flex items-center justify-center transition-all duration-300 hover:scale-110"
        v-html="link.svg"
      ></a>
    </div>

    <p class="text-text-secondary text-sm">
      {{ t('footer.text') }}
    </p>

    <div class="mt-6 flex flex-wrap items-center justify-center gap-4">
      <RouterLink
        v-for="link in appLinks"
        :key="link.label"
        :to="link.to"
        :aria-label="link.label"
        class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-token transition hover:border-[var(--color-primary)] hover:scale-110"
      >
        <img :src="link.icon" :alt="link.label" class="h-full w-full object-contain p-0.5" />
      </RouterLink>
    </div>
  </footer>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const socialLinks = [
  {
    label: 'GitHub',
    href: 'https://github.com/sa-bt',
    /* رنگ برند گیت‌هاب مشکیه و در تم دارک نامرئی می‌شه؛ heading در هر تم کنتراست درست رو داره */
    color: 'var(--color-heading)',
    shadow: 'color-mix(in srgb, var(--color-heading) 40%, transparent)',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
      <path d="M9 18c-4.51 2-5-2-7-2"/>
    </svg>`,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/pourya-bakhshian-406175201/',
    color: '#0A66C2',
    shadow: 'rgba(10,102,194,0.35)',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect width="4" height="12" x="2" y="9"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>`,
  },
  {
    label: 'Telegram',
    href: 'https://t.me/Sabt_p',
    color: '#229ED9',
    shadow: 'rgba(34,158,217,0.35)',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z"/>
      <path d="M22 2 11 13"/>
    </svg>`,
  },
  {
    label: 'Instagram',
    href: '#',
    color: '#E4405F',
    shadow: 'rgba(228,64,95,0.35)',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>`,
  },
  {
    label: 'Gmail',
    href: 'mailto:bakhshian2020@gmail.com',
    color: '#EA4335',
    shadow: 'rgba(234,67,53,0.35)',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.5 6.75v10.5c0 .69.56 1.25 1.25 1.25h12.5c.69 0 1.25-.56 1.25-1.25V6.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M4.75 6.5 12 12.25 19.25 6.5" stroke="currentColor" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M4.75 17.5V7.25L12 13l7.25-5.75V17.5" stroke="currentColor" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
]

const appLinks = [
  {
    label: 'ورود کاربر',
    to: { name: 'login' },
    icon: '/pwa-192x192.png',
  },
  {
    label: 'ورود مدیر',
    to: { name: 'adminLogin' },
    icon: '/admin-pwa-192x192.png',
  },
]
</script>

<style scoped>
.footer-social-link {
  color: var(--color-text-secondary);
}

.footer-social-link:hover {
  color: var(--footer-hover-color);
  border-color: var(--footer-hover-color);
  box-shadow: 0 0 12px var(--footer-hover-shadow);
}
</style>
