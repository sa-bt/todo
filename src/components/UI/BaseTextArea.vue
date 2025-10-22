<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number, null], default: '' },
  name: { type: String, required: true },
  label: { type: String, required: true },
  placeholder: { type: String, default: '' },
  error: { type: String, default: null },
  rows: { type: [String, Number], default: 4 },
  disabled: { type: Boolean, default: false },
  size: { type: String, default: 'md' }, // sm | md | lg
  dir: { type: String, default: 'rtl' }  // 👈 جهت نوشتار (پیش‌فرض راست‌به‌چپ)
})

const emit = defineEmits(['update:modelValue'])

const inputValue = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'text-xs py-2.5 px-3 rounded-lg'
  if (props.size === 'lg') return 'text-base py-3.5 px-4 rounded-xl'
  return 'text-sm py-3 px-4 rounded-xl'
})

const textareaClasses = computed(() => [
  'block w-full tap-target transition duration-200 resize-y',
  'bg-[var(--color-background)] text-[var(--color-text)]',
  'border border-[var(--color-border)]',
  'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--color-primary)_30%,white)]',
  'placeholder:text-[var(--color-text)]/40',
  sizeClass.value,
  props.error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : '',
  props.disabled ? 'opacity-70 cursor-not-allowed bg-[var(--color-background-soft)]' : ''
])
</script>

<template>
  <div class="space-y-2 w-full">
    <label :for="name" class="block text-sm font-semibold text-[var(--color-heading)]">
      {{ label }}
    </label>

    <textarea
        :id="name"
        :name="name"
        :rows="rows"
        :placeholder="placeholder"
        v-model="inputValue"
        :disabled="disabled"
        :dir="dir"
    :class="textareaClasses"
    :aria-describedby="error ? `${name}-error` : undefined"
    :aria-invalid="error ? 'true' : 'false'"
    >
    </textarea>

    <p v-if="error" :id="`${name}-error`" class="text-sm text-red-500 font-medium">
      {{ error }}
    </p>
  </div>
</template>
