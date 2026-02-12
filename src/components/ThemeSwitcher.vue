<template>
  <!-- کانتینر: بدون سایه، با پدینگ خیلی کم و مرز بسیار نازک -->
  <div
      class="flex items-center gap-1 p-0.5 rounded-full surface-soft border border-token/10"
      role="radiogroup"
      aria-label="انتخاب تم"
  >
    <button
        v-for="theme in themeOptions"
        :key="theme.key"
        @click="setTheme(theme.key)"
        class="flex items-center justify-center rounded-full transition-colors duration-200 focus:outline-none"
        :class="[
        /* کاهش سایز دکمه‌ها: موبایل 6px، دسکتاپ 7px */
        'w-6 h-6 md:w-7 md:h-7',
        /* استایل فعال: فقط تغییر رنگ پس‌زمینه (بدون سایه و بزرگ شدن) */
        isActive(theme.key)
          ? 'bg-[var(--color-primary)] text-white'
          : /* استایل غیرفعال: آیکون خاکستری ملایم */
            'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-mute)] hover:text-[var(--color-text)]'
      ]"
        :title="theme.hint"
    >
      <!-- آیکون: سایز کوچک و بدون انیمیشن -->
      <component :is="theme.icon" class="w-3.5 h-3.5 md:w-4 md:h-4 pointer-events-none" />
    </button>
  </div>
</template>

<script setup>
import { useThemeStore } from '@/stores/theme'
import { Sun, Moon, Sparkles } from 'lucide-vue-next'

const themeStore = useThemeStore()

const themeOptions = [
  { key: 'minimal-sage', name: 'Sage', icon: Sparkles, hint: 'تم سبز روشن' },
  { key: 'minimal-sand', name: 'Sand', icon: Sun, hint: 'تم شنی روشن' },
  { key: 'dark', name: 'Dark', icon: Moon, hint: 'تم تیره' },
]

const setTheme = (key) => {
  themeStore.setTheme(key)
}

const isActive = (key) => {
  return themeStore.currentTheme === key
}
</script>

<style scoped>
/* استایل خاصی نیاز نیست، همه چیز با Tailwind هندل شده */
</style>
