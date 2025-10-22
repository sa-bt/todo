<script setup>
import { computed } from 'vue'
import { Loader } from 'lucide-vue-next'

const props = defineProps({
  type: { type: String, default: 'button' },          // button | submit | reset
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },          // حالت لودینگ مستقل از disabled
  variant: { type: String, default: 'primary' },       // primary | secondary | ghost | danger
  size: { type: String, default: 'md' },               // sm | md | lg
  block: { type: Boolean, default: false },            // تمام عرض
  ariaLabel: { type: String, default: '' },
})

const emit = defineEmits(['click'])

function onClick(e){
  if (!props.disabled && !props.loading) emit('click', e)
}

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'text-xs px-3 py-2 rounded-lg'
  if (props.size === 'lg') return 'text-base px-5 py-3.5 rounded-xl'
  return 'text-sm px-4 py-2.5 rounded-xl'
})

const variantClass = computed(() => {
  switch (props.variant) {
    case 'secondary':
      return 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/20 border border-[color-mix(in_oklab,var(--color-secondary)_20%,var(--color-border))]'
    case 'ghost':
      return 'bg-[var(--color-background-soft)] text-[var(--color-heading)] hover:bg-[var(--color-background-soft-hover)] border border-[var(--color-border)]'
    case 'danger':
      return 'bg-red-600 text-white hover:bg-red-700 border border-red-700/40'
    default: // primary
      return 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white border border-[color-mix(in_oklab,var(--color-primary)_30%,var(--color-border))]'
  }
})

const stateClass = computed(() =>
    (props.disabled || props.loading)
        ? 'opacity-50 cursor-not-allowed'
        : 'cursor-pointer'
)
</script>

<template>
  <button
      :type="type"
      :aria-label="ariaLabel || undefined"
      :disabled="disabled || loading"
      @click="onClick"
      class="btn tap-target inline-flex items-center justify-center gap-2 transition duration-200 font-semibold shadow-sm focus:outline-none focus-visible:ring-2"
      :class="[ sizeClass, variantClass, stateClass, block ? 'w-full' : '' ]"
  >
    <Loader v-if="loading" class="h-5 w-5 animate-spin" />
    <span :class="{ 'opacity-0': loading }"><slot /></span>
  </button>
</template>
