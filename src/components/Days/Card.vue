<script setup>
import { ref, computed, watch } from 'vue'
import * as icons from 'lucide-vue-next'
import { toPersianNumber } from '@/utils/number'

const props = defineProps({
  title: String,
  value: Number,
  icon: String,
  // این prop برای رنگ آیکون و پروگرس است و باید بماند
  color: { type: String, default: 'blue' },
  progress: Number, // درصد پروگرس کارت
})

// کلاس‌های رنگی Tailwind CSS
// توجه: اینها برای رنگ‌بندی *آیکون* داخلی هستند و باید با تم هماهنگ باشند
const colorClasses = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-500', stroke: 'stroke-blue-400' },
  green: { bg: 'bg-green-100', text: 'text-green-500', stroke: 'stroke-green-400' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-500', stroke: 'stroke-orange-400' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-500', stroke: 'stroke-indigo-400' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-500', stroke: 'stroke-gray-400' },
}

// گرفتن آیکن داینامیک
const IconComp = computed(() => icons[props.icon])

// پروگرس دایره
const radius = 28
const circumference = 2 * Math.PI * radius
const displayedProgress = ref(props.progress || 0)

// انیمیشن نرم پروگرس
watch(
  () => props.progress,
  (newVal) => {
    if (newVal == null) return
    const step = () => {
      if (Math.abs(displayedProgress.value - newVal) < 0.1) {
        displayedProgress.value = newVal
        return
      }
      displayedProgress.value += (newVal - displayedProgress.value) * 0.1
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  },
  { immediate: true }
)

const dashoffset = computed(() =>
  circumference - (circumference * displayedProgress.value) / 100
)
</script>

<template>
  <div
    class="surface text-[var(--color-text)] rounded-2xl p-5 shadow-lg flex flex-col items-center gap-3 transition transform hover:scale-105 hover:shadow-xl relative border border-token"
    style="transition-property: transform, box-shadow, background-color, border-color;"
  >
    <div v-if="props.progress != null" class="relative flex items-center justify-center w-20 h-20">
      <svg class="absolute inset-0 w-full h-full" viewBox="0 0 64 64">
        <circle
          :class="colorClasses[props.color || 'blue'].stroke"
          cx="32"
          cy="32"
          :r="radius"
          stroke-width="4"
          fill="none"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashoffset"
          transform="rotate(-90 32 32)"
        />
      </svg>

      <div
        class="flex items-center justify-center rounded-full w-12 h-12 animate-bounce-on-change"
        :class="colorClasses[props.color || 'blue'].bg"
      >
        <component :is="IconComp" class="w-9 h-9" :class="colorClasses[props.color || 'blue'].text" />
      </div>
    </div>

    <div
      v-else
      class="p-4 rounded-full flex items-center justify-center animate-bounce-on-change"
      :class="colorClasses[props.color || 'blue'].bg"
    >
      <component :is="IconComp" class="w-8 h-8" :class="colorClasses[props.color || 'blue'].text" />
    </div>

    <p class="text-sm font-medium text-[var(--color-text-secondary)]">{{ props.title }}</p>
    <h3 class="text-2xl font-bold text-[var(--color-heading)]">{{ toPersianNumber(props.value) }}</h3>
    <span v-if="props.progress != null" class="text-xs text-[var(--color-text-secondary)]">
      {{ toPersianNumber(Math.round(displayedProgress)) }}٪
    </span>
  </div>
</template>

<style scoped>
@keyframes bounceOnChange {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.animate-bounce-on-change {
  animation: bounceOnChange 0.8s ease-in-out;
}
</style>