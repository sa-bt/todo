<script setup>
import { computed } from 'vue';
import BaseSelect from '@/components/UI/BaseSelect.vue'; // ✅ استفاده مجدد از منطق BaseSelect

const props = defineProps({
  // ✅ v-model: مقدار زمان (به صورت رشته HH:MM:SS یا HH:MM)
  modelValue: {
    type: [String, null],
    default: null
  },

  // ✅ نام فیلد و لیبل
  name: { type: String, required: true },
  label: { type: String, required: true },

  // ✅ سایر propsها
  placeholder: { type: String, default: 'انتخاب ساعت' },
  error: { type: String, default: null },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue']);

// --- منطق اصلی: تولید گزینه‌های زمان ---
const timeOptions = computed(() => {
  const options = [];
  // تولید ساعات از 00:00 تا 23:00 با فواصل یک ساعته
  for (let h = 0; h < 24; h++) {
    const hour = String(h).padStart(2, '0');
    // مقدار در دیتابیس به صورت HH:MM:SS ذخیره می‌شود
    const value = `${hour}:00:00`;
    // لیبل نمایش داده شده به کاربر (مثلاً 08:00)
    const label = `${hour}:00`;

    options.push({ value, label });
  }
  return options;
});

// ✅ منطق v-model با استفاده از BaseSelect
const selectedTime = computed({
  get() {
    // از آنجایی که BaseSelect با رشته کار می‌کند، modelValue را مستقیماً برمی‌گردانیم
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  }
});
</script>

<template>
  <BaseSelect
      :model-value="selectedTime"
      @update:model-value="(val) => selectedTime = val"
      :options="timeOptions"
      :name="name"
      :label="label"
      :placeholder="placeholder"
      :error="error"
      :disabled="disabled"
  />
</template>
