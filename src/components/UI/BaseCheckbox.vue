<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  name: { type: String, required: true },
  label: { type: String, required: true },
  description: { type: String, default: null },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const checkedValue = computed({
  get() { return props.modelValue },
  set(value) { emit('update:modelValue', value) }
})

const isRtl = computed(() => {
  // برای جابجایی صحیح دستگیره
  return document.documentElement.dir === 'rtl' || getComputedStyle(document.documentElement).direction === 'rtl';
});

const showLabelWrapper = computed(() => props.label && props.label.length > 0)

function toggleCheck() {
  if (!props.disabled) {
    checkedValue.value = !checkedValue.value
  }
}
</script>

<template>
  <div class="flex items-start justify-between p-3 transition duration-200"
       :class="{
           'surface border border-token rounded-xl': showLabelWrapper,
           'opacity-70 cursor-not-allowed bg-[var(--color-background-soft)]': disabled && showLabelWrapper,
           'w-fit h-fit p-0': !showLabelWrapper
       }">

    <div v-if="showLabelWrapper" class="flex flex-col flex-1" :class="{'pl-4': isRtl}">
      <label
          :for="name"
          class="text-sm font-semibold cursor-pointer text-[var(--color-heading)]"
          :class="{'cursor-default': disabled}"
          @click.prevent="toggleCheck"
      >
        {{ label }}
      </label>
      <p v-if="description" class="text-xs mt-1 text-[var(--color-text-secondary)]">
        {{ description }}
      </p>
    </div>

    <div class="flex items-center gap-2">
      <button
          type="button"
          role="switch"
          :aria-checked="checkedValue ? 'true' : 'false'"
          @click="toggleCheck"
          :disabled="disabled"
          :id="name"
          :class="[
                'toggle-track relative inline-flex flex-shrink-0 h-5 w-9 rounded-full cursor-pointer transition-colors ease-in-out duration-200 ring-focus border border-transparent',
                checkedValue ? 'bg-[var(--color-primary)]' : 'bg-gray-400',
                disabled && 'cursor-not-allowed'
            ]"
      >
        <span class="sr-only">{{ label || name }}</span>
        <span
            aria-hidden="true"
            :class="[
                'toggle-thumb pointer-events-none absolute h-4 w-4 rounded-full bg-white shadow ring-0 transition ease-in-out duration-200',
                checkedValue ? 'is-checked' : 'is-unchecked'
            ]"
        ></span>
      </button>

      <span
          class="text-xs font-medium px-2 py-0.5 rounded-full transition-colors duration-200"
          :class="checkedValue
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-200 text-gray-600'"
      >
            {{ checkedValue ? 'فعال' : 'غیرفعال' }}
        </span>
    </div>
  </div>
</template>
<style scoped>
/* 💡 Custom CSS برای موقعیت دهی دقیق پیکسل‌ها و حل مشکل بیرون زدگی */

/* تنظیمات حالت خاموش */
.toggle-track {
  /* اطمینان از قرارگیری در وسط عمودی */
  align-items: center;
}

/* دستگیره در حالت خاموش (is-unchecked) */
.toggle-thumb.is-unchecked {
  /* برای راست به چپ (RTL): دستگیره در سمت راست قرار می‌گیرد */
  right: 2px;
  left: auto;
  /* این مقدار 2px، فضای بین دستگیره و لبه کپسول است */
}

/* دستگیره در حالت روشن (is-checked) */
.toggle-thumb.is-checked {
  /* برای راست به چپ (RTL): دستگیره در سمت چپ قرار می‌گیرد */
  left: 2px;
  right: auto;
}

/* جابجایی دستگیره برای جهت چپ به راست (LTR) */
[dir="ltr"] .toggle-thumb.is-unchecked {
  left: 2px;
  right: auto;
}

[dir="ltr"] .toggle-thumb.is-checked {
  /* محاسبه موقعیت: عرض کل (36px) - عرض دستگیره (16px) - فاصله لبه (2px)
  36 - 16 - 2 = 18px
  Tailwind: left-[18px]
  */
  left: calc(100% - 18px);
  right: auto;
}
</style>
