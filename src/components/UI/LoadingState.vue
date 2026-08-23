<script setup>
/**
 * Shared "fetching" placeholder.
 *
 * The companion of EmptyState: that one covers empty / filter / error, this one
 * covers the wait before any of them is known. Every page used to draw its own
 * spinner (different size, different border style, different sentence), so the
 * same wait looked like a different app on each tab.
 */
import { Loader2 } from 'lucide-vue-next'

defineProps({
  title: { type: String, default: 'در حال بارگذاری…' },
  compact: { type: Boolean, default: false },
})
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-3 rounded-3xl border border-token surface-soft px-4 text-center"
    :class="compact ? 'py-8' : 'py-12'"
    dir="rtl"
    aria-busy="true"
    aria-live="polite"
  >
    <span class="flex h-12 w-12 items-center justify-center rounded-2xl state-icon">
      <Loader2 class="h-6 w-6 animate-spin" aria-hidden="true" />
    </span>

    <p class="text-base font-bold text-[var(--color-heading)]">{{ title }}</p>
  </div>
</template>

<style scoped>
.state-icon {
  background: color-mix(in oklab, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
}
</style>
