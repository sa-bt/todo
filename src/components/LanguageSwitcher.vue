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
import { useRoute, useRouter } from 'vue-router'
import { watch, onMounted, nextTick } from 'vue'

const { locale } = useI18n()
const route = useRoute()
const router = useRouter()
const currentLang = locale

const toggleLang = async () => {
  currentLang.value = currentLang.value === 'fa' ? 'en' : 'fa'
  localStorage.setItem('lang', currentLang.value)

  if (route.name === 'landing') {
    await router.push({
      name: 'landing',
      params: { locale: currentLang.value },
      hash: route.hash,
    })
  }

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
  const saved = route.meta.locale || localStorage.getItem('lang')
  if (saved && saved !== currentLang.value) {
    currentLang.value = saved
  }
  applyLangSettings()
})

watch(currentLang, applyLangSettings)
</script>
