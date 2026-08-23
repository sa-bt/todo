<script setup>
import { computed } from 'vue'
import { toPersianNumber } from '@/utils/number'

/**
 * The one statistic card used by the day, week, month, goals and report pages.
 *
 * `color` keeps the palette names the calling pages already pass ('blue',
 * 'green', ...) but each one now resolves to a theme token instead of a fixed
 * Tailwind shade, so the card stays readable in the dark and sand themes.
 *
 * `icon` takes the lucide component itself, never its name: looking a name up
 * in the icon namespace would pull the whole icon set into the bundle.
 */
const props = defineProps({
  title: { type: String, required: true },
  value: { type: [Number, String], required: true },
  icon: { type: [Object, Function], default: null },
  color: { type: String, default: 'blue' },
  // 0..100. When present the card also renders a progress bar.
  progress: { type: Number, default: null },
})

const TONES = {
  blue: 'var(--color-primary)',
  green: 'var(--color-success)',
  orange: 'var(--color-warning)',
  indigo: 'var(--color-accent)',
  gray: 'var(--color-text-secondary)',
  red: 'var(--color-danger)',
}

const tone = computed(() => TONES[props.color] || TONES.blue)

// Numbers get Persian digits; a value already formatted by the page (for
// example '82%') is shown untouched.
const displayValue = computed(() =>
  typeof props.value === 'number' ? toPersianNumber(props.value) : props.value,
)

const clampedProgress = computed(() =>
  props.progress == null ? null : Math.min(100, Math.max(0, Math.round(props.progress))),
)
</script>

<template>
  <div
    class="rounded-2xl border border-token surface p-4 sm:p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
  >
    <div class="flex items-center gap-3">
      <span
        v-if="icon"
        class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        :style="{ color: tone, background: `color-mix(in oklab, ${tone} 14%, transparent)` }"
      >
        <component :is="icon" class="h-5 w-5" aria-hidden="true" />
      </span>

      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-[var(--color-text-secondary)]">{{ title }}</p>
        <p class="mt-0.5 text-2xl font-extrabold text-[var(--color-heading)]">{{ displayValue }}</p>
      </div>

      <span
        v-if="clampedProgress !== null"
        class="shrink-0 text-sm font-bold"
        :style="{ color: tone }"
      >
        {{ toPersianNumber(clampedProgress) }}٪
      </span>
    </div>

    <div
      v-if="clampedProgress !== null"
      class="mt-3 h-1.5 w-full overflow-hidden rounded-full surface-mute"
      role="presentation"
    >
      <div
        class="h-full rounded-full transition-[width] duration-500"
        :style="{ width: clampedProgress + '%', background: tone }"
      ></div>
    </div>
  </div>
</template>
