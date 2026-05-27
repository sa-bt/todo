<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ChevronDown, Check } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean, Object, null],
    default: null,
  },

  options: {
    type: Array,
    default: () => [],
  },

  placeholder: {
    type: String,
    default: 'انتخاب کنید',
  },

  disabled: {
    type: Boolean,
    default: false,
  },

  align: {
    type: String,
    default: 'auto', // auto | left | right
    validator: (value) => ['auto', 'left', 'right'].includes(value),
  },

  maxHeight: {
    type: Number,
    default: 280,
  },

  name: {
    type: String,
    required: true,
  },

  label: {
    type: String,
    default: null,
  },

  size: {
    type: String,
    default: 'md', // sm | md
    validator: (value) => ['sm', 'md'].includes(value),
  },

  fullWidth: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue', 'open', 'close', 'change'])

const isOpen = ref(false)
const opener = ref(null)
const menu = ref(null)

const position = ref({
  top: 0,
  left: 0,
  width: 0,
})

const selectedOption = computed(() => {
  return props.options.find((option) => option.value === props.modelValue) || null
})

const selectedLabel = computed(() => {
  return selectedOption.value?.label ?? props.placeholder
})

const isPlaceholder = computed(() => {
  return !selectedOption.value
})

const dir = computed(() => {
  if (typeof window === 'undefined') return 'rtl'

  return getComputedStyle(document.documentElement).direction || 'rtl'
})

const buttonSizeClass = computed(() => {
  if (props.size === 'sm') {
    return 'px-3 py-2 text-sm min-h-[40px]'
  }

  return 'px-3 py-[0.625rem] text-sm min-h-[42px]'
})

function open() {
  if (props.disabled) return
  if (isOpen.value) return

  isOpen.value = true
  emit('open')

  nextTick(() => {
    reposition()
    attach()
  })
}

function close() {
  if (!isOpen.value) return

  isOpen.value = false
  emit('close')
  detach()
}

function toggle() {
  isOpen.value ? close() : open()
}

function selectOption(option) {
  if (props.disabled) return

  emit('update:modelValue', option.value)
  emit('change', option.value)

  close()

  nextTick(() => {
    opener.value?.focus()
  })
}

function reposition() {
  const element = opener.value

  if (!element) return

  const rect = element.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  const desiredWidth = rect.width
  const menuHeight = Math.min(props.maxHeight, props.options.length * 44)

  let top = rect.bottom + 6
  let left = rect.left

  const resolvedAlign = props.align === 'auto'
    ? dir.value === 'rtl'
      ? 'right'
      : 'left'
    : props.align

  if (resolvedAlign === 'right') {
    left = rect.right - desiredWidth
  }

  left = Math.min(Math.max(8, left), viewportWidth - desiredWidth - 8)

  const hasEnoughSpaceBelow = rect.bottom + menuHeight + 12 <= viewportHeight

  if (!hasEnoughSpaceBelow && rect.top > menuHeight + 12) {
    top = rect.top - menuHeight - 6
  }

  position.value = {
    top,
    left,
    width: desiredWidth,
  }
}

function onGlobalClick(event) {
  if (!isOpen.value) return

  const path = event.composedPath?.() || []

  if (!path.includes(opener.value) && !path.includes(menu.value)) {
    close()
  }
}

function onKey(event) {
  if (!isOpen.value && ['ArrowDown', 'Enter', ' '].includes(event.key)) {
    event.preventDefault()
    open()
    return
  }

  if (!isOpen.value) return

  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }

  const currentIndex = props.options.findIndex((option) => option.value === props.modelValue)

  if (event.key === 'ArrowDown') {
    event.preventDefault()

    const nextIndex = currentIndex < props.options.length - 1 ? currentIndex + 1 : 0
    const nextOption = props.options[nextIndex]

    if (nextOption) {
      emit('update:modelValue', nextOption.value)
      emit('change', nextOption.value)
    }

    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()

    const previousIndex = currentIndex > 0 ? currentIndex - 1 : props.options.length - 1
    const previousOption = props.options[previousIndex]

    if (previousOption) {
      emit('update:modelValue', previousOption.value)
      emit('change', previousOption.value)
    }

    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    close()

    nextTick(() => {
      opener.value?.focus()
    })
  }
}

function attach() {
  window.addEventListener('scroll', reposition, true)
  window.addEventListener('resize', reposition)
  window.addEventListener('mousedown', onGlobalClick, true)
  window.addEventListener('keydown', onKey, true)
}

function detach() {
  window.removeEventListener('scroll', reposition, true)
  window.removeEventListener('resize', reposition)
  window.removeEventListener('mousedown', onGlobalClick, true)
  window.removeEventListener('keydown', onKey, true)
}

watch(
  () => props.options,
  () => {
    if (isOpen.value) {
      nextTick(reposition)
    }
  },
  { deep: true }
)

watch(isOpen, (value) => {
  if (value) {
    nextTick(reposition)
  }
})

onMounted(() => {
  nextTick(reposition)
})

onBeforeUnmount(() => {
  detach()
})
</script>

<template>
  <div
    class="base-select"
    :class="{ 'w-full': fullWidth }"
  >
    <label
      v-if="props.label"
      :for="name"
      class="base-select__label"
    >
      {{ props.label }}
    </label>

    <button
      ref="opener"
      :id="name"
      type="button"
      class="base-select__button"
      :class="[
        buttonSizeClass,
        {
          'opacity-70 cursor-not-allowed bg-[var(--color-background-soft)]': disabled,
          'ring-active': isOpen,
        },
      ]"
      :aria-expanded="isOpen ? 'true' : 'false'"
      aria-haspopup="listbox"
      :disabled="disabled"
      @click="toggle"
    >
      <span
        class="truncate"
        :class="{ 'text-[var(--color-text-secondary)]': isPlaceholder }"
      >
        {{ selectedLabel }}
      </span>

      <ChevronDown
        class="w-4 h-4 shrink-0 opacity-70 transition-transform"
        :class="{ 'rotate-180': isOpen }"
        aria-hidden="true"
      />
    </button>

    <Teleport to="body">
      <transition name="fade-slide-y">
        <div
          v-show="isOpen"
          ref="menu"
          class="base-select__menu"
          :style="{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
            maxHeight: `${maxHeight}px`,
          }"
          role="listbox"
        >
          <button
            v-for="option in options"
            :key="`${String(option.value)}-${String(option.label)}`"
            type="button"
            class="base-select__option"
            :class="{
              'base-select__option--selected': option.value === modelValue,
            }"
            :aria-selected="option.value === modelValue ? 'true' : 'false'"
            tabindex="-1"
            @click="selectOption(option)"
          >
            <span class="truncate">
              {{ option.label }}
            </span>

            <Check
              v-if="option.value === modelValue"
              class="w-4 h-4 shrink-0"
              aria-hidden="true"
            />
          </button>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
.base-select {
  position: relative;
}

.base-select__label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-heading);
}

.base-select__button {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;

  border-radius: 0.75rem;
  border: 1px solid var(--color-border);

  background: var(--color-background);
  color: var(--color-text);

  text-align: right;
  line-height: 1.25rem;

  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;
}

.base-select__button:hover:not(:disabled) {
  background: var(--color-background-soft);
}

.base-select__button:focus,
.base-select__button.ring-active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 22%, transparent);
}

.base-select__menu {
  position: fixed;
  z-index: 9999;

  overflow: auto;

  border-radius: 0.75rem;
  border: 1px solid var(--color-border);

  background: var(--color-background);
  color: var(--color-text);

  box-shadow:
    0 18px 45px rgba(0, 0, 0, 0.16),
    0 4px 12px rgba(0, 0, 0, 0.08);
}

.base-select__option {
  width: 100%;
  min-height: 40px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;

  padding: 0.5rem 0.75rem;

  border: 0;
  background: transparent;
  color: var(--color-text);

  text-align: right;
  font-size: 0.875rem;
  font-weight: 500;

  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.base-select__option:hover {
  background: var(--color-background-soft);
}

.base-select__option--selected {
  background: color-mix(in oklab, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  font-weight: 800;
}

.base-select__option--selected:hover {
  background: color-mix(in oklab, var(--color-primary) 14%, transparent);
}

.fade-slide-y-enter-active,
.fade-slide-y-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.fade-slide-y-enter-from,
.fade-slide-y-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.base-select__menu::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.base-select__menu::-webkit-scrollbar-thumb {
  background: color-mix(in oklab, var(--color-border) 60%, var(--color-text) 40%);
  border-radius: 999px;
}

.base-select__menu::-webkit-scrollbar-track {
  background: transparent;
}

.base-select__button,
.base-select__option {
  direction: rtl;
  text-align: right;
}

.base-select__option span {
  text-align: right;
}
</style>