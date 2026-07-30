<template>
  <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-background-soft)] p-4">
    <p class="text-sm text-[var(--color-text-secondary)]">{{ label }}</p>

    <p class="mt-2 text-3xl font-extrabold text-[var(--color-heading)]">
      {{ displayValue }}<span v-if="suffix" class="mr-1 text-lg font-bold">{{ suffix }}</span>
    </p>

    <p v-if="comparison" class="mt-2 text-xs text-[var(--color-text-secondary)]">
      {{ comparison }}
    </p>

    <p v-else class="mt-2 flex items-center gap-1 text-xs" :class="changeClass">
      <component v-if="changeIcon" :is="changeIcon" class="h-3.5 w-3.5" aria-hidden="true" />
      <span>{{ changeText }}</span>
    </p>
  </div>
</template>

<script setup>
/*
 * یک عدد سرشماره با تغییرش نسبت به دوره قبل.
 *
 * درصد تغییر روی سرور حساب می‌شود و همین‌جا فقط خوانده می‌شود، تا دو جای
 * برنامه دو فرمول برای یک عدد نداشته باشند.
 */
import { computed } from 'vue'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-vue-next'
import { toPersianNumber } from '@/utils/number'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [Number, null], default: null },
  suffix: { type: String, default: '' },

  // درصد تغییر. تهی یعنی دوره قبل خالی بوده و رشد از صفر درصد ندارد.
  change: { type: [Number, null], default: null },

  /*
   * جایگزین خط تغییر، برای عددهایی که درصدِ تغییرشان بی‌معنی است.
   *
   * نرخ خروج فوری خودش درصد است و «۱۲ درصد بیشتر از دوره قبل» درباره یک درصد،
   * خواننده را گمراه می‌کند. برای این‌ها خود مقدار دوره قبل نوشته می‌شود.
   */
  comparison: { type: String, default: '' },

  // برای نرخ خروج فوری، کم‌شدن خبر خوبی است نه بد.
  higherIsBetter: { type: Boolean, default: true },
})

const displayValue = computed(() =>
  props.value === null || props.value === undefined
    ? '—'
    : toPersianNumber(Number(props.value).toLocaleString('en-US'))
)

const hasChange = computed(() => props.change !== null && props.change !== undefined)

const direction = computed(() => {
  if (!hasChange.value || props.change === 0) return 'flat'

  return props.change > 0 ? 'up' : 'down'
})

const changeIcon = computed(() => {
  if (!hasChange.value) return null

  return { up: ArrowUpRight, down: ArrowDownRight, flat: Minus }[direction.value]
})

const changeText = computed(() => {
  if (!hasChange.value) return 'دوره قبل داده‌ای نداشت'
  if (props.change === 0) return 'بدون تغییر نسبت به دوره قبل'

  const amount = toPersianNumber(Math.abs(props.change).toLocaleString('en-US'))
  const word = direction.value === 'up' ? 'بیشتر' : 'کمتر'

  return `${amount}٪ ${word} از دوره قبل`
})

/*
 * جهت تغییر به تنهایی خوب یا بد نیست. بالا رفتن بازدید خوب است و بالا رفتن
 * نرخ خروج فوری بد. رنگ از ترکیب جهت و همین پرچم می‌آید، نه فقط از جهت.
 */
const changeClass = computed(() => {
  if (!hasChange.value || direction.value === 'flat') {
    return 'text-[var(--color-text-secondary)]'
  }

  const good = direction.value === 'up' ? props.higherIsBetter : !props.higherIsBetter

  return good ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
})
</script>
