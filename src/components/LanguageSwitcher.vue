<template>
  <button
      @click="toggleLang"
      class="text-sm px-3 py-1 border rounded-full transition-all hover:bg-[var(--color-primary)] hover:text-white"
  >
    {{ currentLang === 'fa' ? 'EN' : 'فا' }}
  </button>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { watch, onMounted } from 'vue'
import { nextTick } from 'vue'

const toggleLang = async () => {
  currentLang.value = currentLang.value === 'fa' ? 'en' : 'fa'
  localStorage.setItem('lang', currentLang.value)
  await nextTick()
  applyLangSettings()
}

const { locale } = useI18n()
const currentLang = locale

// تغییر زبان و ذخیره در localStorage

// تابع اعمال تنظیمات راست‌چین/چپ‌چین و فونت
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

// بازیابی زبان ذخیره‌شده
onMounted(() => {
  const saved = localStorage.getItem('lang')
  if (saved && saved !== currentLang.value) currentLang.value = saved
  applyLangSettings()
})

// واکنش به تغییر زبان
watch(currentLang, applyLangSettings)
</script>

<style>

</style>
