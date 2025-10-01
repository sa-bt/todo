<script setup>
import { useThemeStore } from '@/stores/theme'
import { Sun, Moon, Sparkles } from 'lucide-vue-next' // آیکون‌های جدید برای تم‌ها

const themeStore = useThemeStore()

// ساختار داده برای نمایش بهتر آیکون‌ها
const themeOptions = [
  { key: 'minimal-sage', name: 'Sage', icon: Sparkles, hint: 'تم سبز روشن' },
  { key: 'minimal-sand', name: 'Sand', icon: Sun, hint: 'تم شنی روشن' },
  { key: 'dark', name: 'Dark', icon: Moon, hint: 'تم تیره' },
]

const handleThemeChange = (key) => {
  themeStore.setTheme(key)
}
</script>

<template>
  <div
      class="flex p-0.5 rounded-xl border border-token shadow-sm transition-colors duration-300"
      :class="{
      'surface-soft': themeStore.currentTheme !== 'dark', // پس زمینه روشن برای تم های روشن
      'surface-mute': themeStore.currentTheme === 'dark' // پس زمینه کمی تیره تر برای تم دارک
    }"
      role="radiogroup"
      aria-label="انتخاب تم برنامه"
  >
    <button
        v-for="theme in themeOptions"
        :key="theme.key"
        @click="handleThemeChange(theme.key)"
        :aria-checked="themeStore.currentTheme === theme.key"
        role="radio"
        :title="theme.hint"
        class="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 relative focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 tap-target"
        :class="{
        // حالت فعال (انتخاب شده)
        'text-white shadow-md transform': themeStore.currentTheme === theme.key,
        // حالت غیرفعال
        'text-text-secondary hover:text-text hover:bg-transparent': themeStore.currentTheme !== theme.key
      }"
        :style="{
        // اعمال رنگ اصلی فقط برای دکمه فعال
        backgroundColor: themeStore.currentTheme === theme.key ? 'var(--color-primary)' : 'transparent',
        // رنگ آیکون در حالت غیر فعال
        color: themeStore.currentTheme !== theme.key ? 'var(--color-text-secondary)' : 'white',
      }"
    >
      <component :is="theme.icon" class="w-4 h-4 flex-shrink-0" />
      <span class="hidden sm:inline">{{ theme.name }}</span>
    </button>
  </div>
</template>
