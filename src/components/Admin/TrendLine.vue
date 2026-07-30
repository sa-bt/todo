<template>
  <figure class="m-0">
    <figcaption class="mb-3 flex items-baseline justify-between gap-2">
      <h3 class="text-sm font-bold text-[var(--color-heading)]">{{ title }}</h3>
      <p v-if="subtitle" class="text-xs text-[var(--color-text-secondary)]">{{ subtitle }}</p>
    </figcaption>

    <div class="relative" @pointerleave="active = null">
      <!--
        قرینه در نمایش، تا مثل نمودار ستونی راست‌به‌چپ خوانده شود. نسبت ابعاد
        هم به همان دلیل نمودار ستونی صریح آمده است.
      -->
      <svg
        :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
        class="block w-full"
        style="aspect-ratio: 600 / 120; transform: scaleX(-1)"
        role="img"
        :aria-label="title"
      >
        <line
          :x1="0"
          :x2="WIDTH"
          :y1="PLOT_HEIGHT"
          :y2="PLOT_HEIGHT"
          stroke="var(--color-border)"
          stroke-width="1"
          vector-effect="non-scaling-stroke"
        />

        <!-- زیر خط، یک شست‌وشوی کم‌رنگ از همان رنگ، نه یک بلوک پررنگ -->
        <path v-if="areaPath" :d="areaPath" fill="var(--color-primary)" opacity="0.1" />

        <path
          v-if="linePath"
          :d="linePath"
          fill="none"
          stroke="var(--color-primary)"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          vector-effect="non-scaling-stroke"
        />

        <!-- خط عمودی راهنما: خواننده به یک تاریخ نشانه می‌رود، نه به یک خط دو نقطه‌ای -->
        <line
          v-if="hovered"
          :x1="hovered.x"
          :x2="hovered.x"
          y1="0"
          :y2="PLOT_HEIGHT"
          stroke="var(--color-border-hover)"
          stroke-width="1"
          vector-effect="non-scaling-stroke"
        />

        <!-- نقطه پایانی همیشه دیده می‌شود، با حلقه‌ای به رنگ زمینه دور آن -->
        <circle
          v-if="lastPoint"
          :cx="lastPoint.x"
          :cy="lastPoint.y"
          r="4"
          fill="var(--color-primary)"
          stroke="var(--color-background)"
          stroke-width="2"
        />

        <circle
          v-if="hovered"
          :cx="hovered.x"
          :cy="hovered.y"
          r="4"
          fill="var(--color-primary)"
          stroke="var(--color-background)"
          stroke-width="2"
        />

        <rect
          v-for="(point, index) in plotted"
          :key="point.label"
          :x="point.x - hitWidth / 2"
          y="0"
          :width="hitWidth"
          :height="PLOT_HEIGHT"
          fill="transparent"
          tabindex="0"
          :aria-label="`${point.label}: ${point.readable}`"
          @pointerenter="active = index"
          @focus="active = index"
          @blur="active = null"
        />
      </svg>

      <div
        v-if="hovered"
        class="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-xs shadow-lg"
        :style="tooltipStyle"
      >
        <span class="font-bold text-[var(--color-heading)]">{{ hovered.readable }}</span>
        <span class="mr-1 text-[var(--color-text-secondary)]">{{ hovered.label }}</span>
      </div>
    </div>

    <div class="mt-2 flex justify-between text-[10px] text-[var(--color-text-secondary)]">
      <span>{{ firstLabel }}</span>
      <span>{{ lastLabel }}</span>
    </div>
  </figure>
</template>

<script setup>
/*
 * روند یک سری در چند دوره پشت سر هم.
 *
 * کنار کارت‌های سرشماره می‌ایستد تا دوره جاری در برابر تاریخچه خودش خوانده
 * شود، نه فقط در برابر یک همسایه.
 */
import { computed, ref } from 'vue'
import { toPersianNumber } from '@/utils/number'

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },

  // هر نقطه: { label, views }
  points: { type: Array, default: () => [] },
})

const WIDTH = 600
const HEIGHT = 120
const PLOT_HEIGHT = 108

/*
 * حاشیه افقی به اندازه شعاع نقطه پایانی به‌اضافه حلقه دورش. بدون آن، نقطه
 * آخرین دوره نصفش بیرون از کادر می‌افتاد و بریده دیده می‌شد.
 */
const PADDING_X = 6

const PLOT_WIDTH = WIDTH - PADDING_X * 2

const active = ref(null)

const maxValue = computed(() => Math.max(1, ...props.points.map(point => Number(point.views) || 0)))

const step = computed(() =>
  props.points.length > 1 ? PLOT_WIDTH / (props.points.length - 1) : PLOT_WIDTH
)

const hitWidth = computed(() => Math.max(24, step.value))

const plotted = computed(() =>
  props.points.map((point, index) => {
    const value = Number(point.views) || 0

    return {
      label: point.label,
      value,
      readable: toPersianNumber(value.toLocaleString('en-US')),
      x: props.points.length > 1 ? PADDING_X + index * step.value : WIDTH / 2,
      y: PLOT_HEIGHT - (value / maxValue.value) * (PLOT_HEIGHT - 8),
    }
  })
)

const linePath = computed(() => {
  if (plotted.value.length < 2) return ''

  return plotted.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
})

const areaPath = computed(() => {
  if (plotted.value.length < 2) return ''

  const first = plotted.value[0]
  const last = plotted.value[plotted.value.length - 1]

  return `${linePath.value} L ${last.x} ${PLOT_HEIGHT} L ${first.x} ${PLOT_HEIGHT} Z`
})

const lastPoint = computed(() => plotted.value[plotted.value.length - 1] ?? null)

const hovered = computed(() => (active.value === null ? null : plotted.value[active.value]))

/* مثل نمودار ستونی: تصویر در نمایش قرینه است، پس جای‌گیری از سمت راست است. */
const tooltipStyle = computed(() =>
  hovered.value
    ? {
        right: `${(hovered.value.x / WIDTH) * 100}%`,
        top: `${(hovered.value.y / HEIGHT) * 100}%`,
        transform: 'translate(50%, calc(-100% - 6px))',
      }
    : {}
)

const firstLabel = computed(() => props.points[0]?.label ?? '')
const lastLabel = computed(() => props.points[props.points.length - 1]?.label ?? '')
</script>
