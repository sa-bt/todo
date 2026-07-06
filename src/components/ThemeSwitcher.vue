<template>
  <!-- کانتینر: بدون سایه، با پدینگ خیلی کم و مرز بسیار نازک -->
  <div
      class="flex items-center gap-1 p-0.5 rounded-full surface-soft border border-token/10"
      role="radiogroup"
      :aria-label="t('theme.label')"
  >
    <BaseTooltip
        v-for="theme in themeOptions"
        :key="theme.key"
        :text="t(theme.hintKey)"
        placement="bottom"
        :delay="150"
    >
      <button
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
          :aria-label="t(theme.hintKey)"
      >
        <!-- آیکون: سایز کوچک و بدون انیمیشن -->
        <component :is="theme.icon" class="w-3.5 h-3.5 md:w-4 md:h-4 pointer-events-none" />
      </button>
    </BaseTooltip>
  </div>
</template>

<script setup>
import { useThemeStore } from '@/stores/theme'
import { useI18n } from 'vue-i18n'
import { Sun, Moon, Sparkles } from 'lucide-vue-next'
import BaseTooltip from '@/components/UI/BaseTooltip.vue'

const themeStore = useThemeStore()
const { t } = useI18n()

const themeOptions = [
  { key: 'minimal-sage', name: 'Sage', icon: Sparkles, hintKey: 'theme.sage' },
  { key: 'minimal-sand', name: 'Sand', icon: Sun, hintKey: 'theme.sand' },
  { key: 'dark', name: 'Dark', icon: Moon, hintKey: 'theme.dark' },
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
