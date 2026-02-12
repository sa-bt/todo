<template>
  <button
      @click="toggleLang"
      class="text-xs sm:text-sm font-medium px-2 py-1 rounded border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
  >
    {{ currentLang === 'fa' ? 'EN' : 'فا' }}
  </button>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { watch, onMounted, nextTick } from 'vue'

const { locale } = useI18n()
const currentLang = locale

const toggleLang = async () => {
  currentLang.value = currentLang.value === 'fa' ? 'en' : 'fa'
  localStorage.setItem('lang', currentLang.value)
  await nextTick()
  applyLangSettings()
}

const applyLangSettings = () => {
  const html = document.documentElement
  if (currentLang.value === 'fa') {
    html.dir = 'rtl'
    html.lang = 'fa'
  } else {
    html.dir = 'ltr'
    html.lang = 'en'
  }
}

onMounted(() => {
  const saved = localStorage.getItem('lang')
  if (saved && saved !== currentLang.value) {
    currentLang.value = saved
  }
  applyLangSettings()
})

watch(currentLang, applyLangSettings)
</script>
