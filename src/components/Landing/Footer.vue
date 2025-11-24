<template>
  <footer class="py-10 text-center mt-20 border-t border-white/10">

    <p class="text-text-secondary text-sm mb-2">
      {{ t('footer.text') }}
    </p>

    <p class="text-xs opacity-40">
      v1.0 — Crafted with ❤️ & Vue + Laravel
    </p>

  </footer>
</template>

<script setup>
import { useI18n } from "vue-i18n"
const { t } = useI18n()
</script>
