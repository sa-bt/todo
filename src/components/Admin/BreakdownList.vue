<template>
  <section>
    <h3 class="mb-3 text-sm font-bold text-[var(--color-heading)]">{{ title }}</h3>

    <p v-if="!rows.length" class="text-xs text-[var(--color-text-secondary)]">
      داده‌ای در این بازه ثبت نشده.
    </p>

    <ul v-else class="space-y-2">
      <li v-for="row in rows" :key="row.key">
        <div class="flex items-baseline justify-between gap-2 text-xs">
          <span class="truncate text-[var(--color-text)]">{{ row.label }}</span>
          <span class="shrink-0 tabular-nums text-[var(--color-text-secondary)]">
            {{ row.readable }} <span class="text-[10px]">({{ row.readablePercent }}٪)</span>
          </span>
        </div>

        <!--
          نوار نسبت. مسیر خالی، پله‌ای روشن از رنگ خود نوار است نه خاکستری
          زمینه: با خاکستری زمینه کارت، مسیر عملاً دیده نمی‌شد و خواننده
          نمی‌فهمید نوار کوتاه است یا اصلاً نواری نیست.
        -->
        <div
          class="mt-1 h-1.5 overflow-hidden rounded-full"
          style="background-color: color-mix(in srgb, var(--color-primary) 18%, transparent)"
        >
          <div
            class="h-full rounded-full bg-[var(--color-primary)]"
            :style="{ width: `${row.percent}%` }"
          />
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
/*
 * تفکیک یک بعد، به شکل فهرست با نوار نسبت.
 *
 * عمداً دایره‌ای نیست. اینجا معمولاً پنج تا هشت دسته هست و یک نمودار دایره‌ای
 * با این تعداد، هشت رنگ می‌خواهد که زیر کوررنگی از هم جدا نمی‌شوند. نوار نسبت
 * با یک رنگ و عدد کنارش، همان چیز را بدون آن هزینه می‌گوید.
 */
import { computed } from 'vue'
import { toPersianNumber } from '@/utils/number'

const props = defineProps({
  title: { type: String, required: true },

  // هر مورد: { key, views }
  items: { type: Array, default: () => [] },

  // برگردان نام فنی به فارسی. کلید ناشناخته با نام خودش می‌ماند.
  labels: { type: Object, default: () => ({}) },
})

const total = computed(() =>
  props.items.reduce((sum, item) => sum + (Number(item.views) || 0), 0)
)

const rows = computed(() =>
  props.items.map(item => {
    const views = Number(item.views) || 0
    const percent = total.value > 0 ? Math.round((views / total.value) * 1000) / 10 : 0

    return {
      key: item.key,
      label: props.labels[item.key] ?? item.key,
      views,
      readable: toPersianNumber(views.toLocaleString('en-US')),
      percent,
      readablePercent: toPersianNumber(percent),
    }
  })
)
</script>
