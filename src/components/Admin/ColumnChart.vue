<template>
  <figure class="m-0">
    <figcaption class="mb-3 flex items-baseline justify-between gap-2">
      <h3 class="text-sm font-bold text-[var(--color-heading)]">{{ title }}</h3>
      <p v-if="subtitle" class="text-xs text-[var(--color-text-secondary)]">{{ subtitle }}</p>
    </figcaption>

    <div class="relative" @pointerleave="active = null">
      <!--
        نمودار راست‌به‌چپ خوانده می‌شود، مثل نقشه سال در گزارش کاربر: قدیمی‌ترین
        ستون سمت راست است. مختصات درون تصویر چپ‌به‌راست می‌ماند و فقط در نمایش
        قرینه می‌شود. چون هیچ متنی داخل تصویر نیست، این قرینه‌کردن چیزی را
        وارونه نمی‌نویسد.

        نسبت ابعاد صریح لازم است. بدون آن، ارتفاع پیش‌فرض تصویر برداری کوتاه‌تر
        از نسبت این نما درمی‌آید و مرورگر به جای پهنا، ارتفاع را ملاک می‌گیرد؛
        نتیجه‌اش نموداری بود که تمام پهنای کارت را نمی‌گرفت و برچسب‌های محور
        زیر ستون‌هایشان نمی‌افتادند.
      -->
      <svg
        :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
        class="block w-full"
        style="aspect-ratio: 600 / 160; transform: scaleX(-1)"
        role="img"
        :aria-label="title"
      >
        <!-- خطوط راهنما، نازک و کم‌رنگ تا جلوی داده را نگیرند -->
        <line
          v-for="tick in ticks"
          :key="`grid-${tick.value}`"
          :x1="PADDING_X"
          :x2="WIDTH - PADDING_X"
          :y1="tick.y"
          :y2="tick.y"
          stroke="var(--color-border)"
          stroke-width="1"
          vector-effect="non-scaling-stroke"
        />

        <g v-for="(bar, index) in bars" :key="bar.label">
          <!-- ستون‌ها با انتهای گرد و پای صاف روی خط مبنا -->
          <path
            :d="bar.path"
            fill="var(--color-primary)"
            :opacity="active === null || active === index ? 1 : 0.45"
          />

          <!-- ناحیه اشاره از خود ستون پهن‌تر است تا نشانه‌گر راحت بگیردش -->
          <rect
            :x="bar.slotX"
            y="0"
            :width="bar.slotWidth"
            :height="PLOT_HEIGHT"
            fill="transparent"
            tabindex="0"
            :aria-label="`${bar.label}: ${bar.readable}`"
            @pointerenter="active = index"
            @focus="active = index"
            @blur="active = null"
          />
        </g>
      </svg>

      <!-- برچسب مستقیم فقط روی بلندترین ستون. عدد روی همه ستون‌ها خوانده نمی‌شود. -->
      <span
        v-if="peak"
        class="pointer-events-none absolute text-[10px] font-bold text-[var(--color-heading)]"
        :style="peakStyle"
      >
        {{ peak.readable }}
      </span>

      <div
        v-if="hovered"
        class="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-xs shadow-lg"
        :style="tooltipStyle"
      >
        <span class="font-bold text-[var(--color-heading)]">{{ hovered.readable }}</span>
        <span class="mr-1 text-[var(--color-text-secondary)]">{{ hovered.label }}</span>
      </div>
    </div>

    <!--
      برای هر ستون یک خانه هم‌عرض ساخته می‌شود و متن فقط در بعضی خانه‌ها نوشته
      می‌شود. اگر فقط همان چند برچسب ساخته می‌شدند، بین خودشان پخش می‌شدند و
      هیچ‌کدام دقیقاً زیر ستون خودش نمی‌ایستاد.
    -->
    <div class="mt-2 flex text-[10px] text-[var(--color-text-secondary)]">
      <span v-for="mark in axisLabels" :key="mark.key" class="flex-1 text-center">
        {{ mark.label }}
      </span>
    </div>
  </figure>
</template>

<script setup>
/*
 * نمودار ستونی تک‌سری.
 *
 * فقط یک چیز اندازه گرفته می‌شود، پس یک رنگ بس است و راهنمای رنگ لازم نیست؛
 * عنوان نمودار خودش می‌گوید چه چیزی رسم شده.
 */
import { computed, ref } from 'vue'
import { toPersianNumber } from '@/utils/number'

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },

  // هر نقطه: { label, views }
  points: { type: Array, default: () => [] },

  // چند برچسب محور افقی نشان داده شود. بیست و چهار ساعت کنار هم جا نمی‌شود.
  labelEvery: { type: Number, default: 1 },
})

const WIDTH = 600
const HEIGHT = 160
const PADDING_X = 4
const PLOT_HEIGHT = 140
const BAR_RADIUS = 4

/* حداکثر ضخامت ستون. باقی جای هر خانه عمداً هوا می‌ماند. */
const MAX_BAR_WIDTH = 24

/* فاصله دو ستون چسبیده، به رنگ زمینه، بدون کشیدن هیچ خطی دور آن‌ها. */
const BAR_GAP = 2

const active = ref(null)

const maxValue = computed(() => Math.max(1, ...props.points.map(point => Number(point.views) || 0)))

const slotWidth = computed(() =>
  props.points.length ? (WIDTH - PADDING_X * 2) / props.points.length : WIDTH
)

const barWidth = computed(() => Math.min(MAX_BAR_WIDTH, Math.max(2, slotWidth.value - BAR_GAP)))

/**
 * مسیر یک ستون: بالا گرد، پای روی خط مبنا صاف.
 *
 * ستون خیلی کوتاه شعاع کمتری می‌گیرد، وگرنه گردی از خود ستون بلندتر می‌شود و
 * شکل عجیبی درمی‌آید.
 */
function barPath(x, y, width, height) {
  const radius = Math.min(BAR_RADIUS, height, width / 2)
  const bottom = PLOT_HEIGHT

  if (height <= 0) return ''

  return [
    `M ${x} ${bottom}`,
    `L ${x} ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    `L ${x + width - radius} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + radius}`,
    `L ${x + width} ${bottom}`,
    'Z',
  ].join(' ')
}

const bars = computed(() =>
  props.points.map((point, index) => {
    const value = Number(point.views) || 0
    const height = (value / maxValue.value) * (PLOT_HEIGHT - 10)
    const slotX = PADDING_X + index * slotWidth.value
    const x = slotX + (slotWidth.value - barWidth.value) / 2
    const y = PLOT_HEIGHT - height

    return {
      label: point.label,
      value,
      readable: toPersianNumber(value.toLocaleString('en-US')),
      path: barPath(x, y, barWidth.value, height),
      centerRatio: (slotX + slotWidth.value / 2) / WIDTH,
      topRatio: y / HEIGHT,
      slotX,
      slotWidth: slotWidth.value,
    }
  })
)

/* سه خط راهنما: صفر، میانه و بیشینه. */
const ticks = computed(() =>
  [0, 0.5, 1].map(ratio => ({
    value: ratio,
    y: PLOT_HEIGHT - ratio * (PLOT_HEIGHT - 10),
  }))
)

const peak = computed(() => {
  if (!bars.value.length) return null

  const top = bars.value.reduce((best, bar) => (bar.value > best.value ? bar : best))

  return top.value > 0 ? top : null
})

/*
 * پوشش‌های روی نمودار با `right` جای می‌گیرند، چون خود تصویر در نمایش قرینه
 * شده و ستون شماره صفر سمت راست دیده می‌شود. جابه‌جایی نصف پهنا، برچسب را روی
 * مرکز ستون می‌نشاند.
 */
const peakStyle = computed(() =>
  peak.value
    ? {
        right: `${peak.value.centerRatio * 100}%`,
        top: `${peak.value.topRatio * 100}%`,
        transform: 'translate(50%, -100%)',
      }
    : {}
)

const hovered = computed(() => (active.value === null ? null : bars.value[active.value]))

const tooltipStyle = computed(() =>
  hovered.value
    ? {
        right: `${hovered.value.centerRatio * 100}%`,
        top: `${hovered.value.topRatio * 100}%`,
        transform: 'translate(50%, calc(-100% - 6px))',
      }
    : {}
)

const axisLabels = computed(() =>
  props.points.map((point, index) => ({
    key: `${index}-${point.label}`,
    label: index % props.labelEvery === 0 ? point.label : '',
  }))
)
</script>
