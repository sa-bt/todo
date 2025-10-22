<script setup>
import { ref, computed, defineExpose } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number, null], default: '' },
  name: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  error: { type: String, default: null },
  disabled: { type: Boolean, default: false },
  inputDir: { type: String, default: 'rtl' },
  size: { type: String, default: 'md' },
  autocomplete: { type: String, default: 'off' },
  autofocus: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const inputValue = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

// ✅ ref به input واقعی
const inputEl = ref(null)

// ✅ expose برای بیرون (مثل GoalModal)
defineExpose({
  focus: () => inputEl.value?.focus(),
  blur: () => inputEl.value?.blur(),
  select: () => inputEl.value?.select(),
})

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'text-xs py-2.5 px-3 rounded-lg'
  if (props.size === 'lg') return 'text-base py-3.5 px-4 rounded-xl'
  return 'text-sm py-3 px-4 rounded-xl'
})

const inputClasses = computed(() => [
  'block w-full tap-target transition duration-200',
  'bg-[var(--color-background)] text-[var(--color-text)]',
  'border border-[var(--color-border)]',
  'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--color-primary)_30%,white)]',
  'placeholder:text-[var(--color-text)]/40',
  sizeClass.value,
  props.error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : '',
  props.disabled ? 'opacity-70 cursor-not-allowed bg-[var(--color-background-soft)]' : ''
])

const extraAttrs = computed(() => {
  if (props.type === 'number') return { inputmode: 'numeric', pattern: '[0-9]*' }
  if (props.type === 'email') return { inputmode: 'email' }
  return {}
})
</script>

<template>
  <div class="space-y-2 w-full">
    <label :for="name" class="block text-sm font-semibold text-[var(--color-heading)]">{{ label }}</label>

    <!-- ✅ ref روی input -->
    <input
        ref="inputEl"
        :id="name"
        :name="name"
        :type="type"
        :placeholder="placeholder"
        v-model="inputValue"
        :disabled="disabled"
        :class="inputClasses"
        :dir="inputDir"
        :aria-describedby="error ? `${name}-error` : undefined"
        :aria-invalid="error ? 'true' : 'false'"
        :autocomplete="autocomplete"
        :autofocus="autofocus"
        v-bind="extraAttrs"
    />

    <p v-if="error" :id="`${name}-error`" class="text-sm text-red-500 font-medium">
      {{ error }}
    </p>
  </div>
</template>
