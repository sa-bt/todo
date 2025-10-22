<script setup>
import { onMounted } from 'vue'
import BaseCheckbox from '@/components/UI/BaseCheckbox.vue'
import BaseTimeSelect from '@/components/UI/BaseTimeSelect.vue'
import { useNotificationStore } from '@/stores/notification'

import { useUserSettingStore } from '@/stores/userSetting'

const toast = useNotificationStore()
const settings = useUserSettingStore()

onMounted(() => {
  if (!settings.loaded) {
    settings.load()
  }
})

async function save() {
  try {
    await settings.save()
  } catch (err) {
    toast.handleApiError(err)
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto mt-10 p-6 bg-[var(--color-background-soft)] rounded-3xl border border-token shadow-md text-[var(--color-text)]">

    <h2 class="text-2xl font-bold mb-10 text-[var(--color-heading)] text-center">تنظیمات نوتیفیکیشن</h2>

    <!-- ✅ گزارش روزانه -->
    <div class="mb-6 p-4 surface rounded-xl border-l-4 border-[var(--color-primary)] shadow-sm space-y-4">
      <div class="flex items-start justify-between">
        <div class="flex flex-col gap-1">
          <h3 class="font-semibold text-[var(--color-heading)]">گزارش روزانه</h3>
          <p class="text-[var(--color-text-secondary)] text-sm">هر شب درصد پیشرفت و پیام انگیزشی برای شما ارسال خواهد شد.</p>
        </div>
        <BaseCheckbox v-model="settings.daily_report" />
      </div>
      <BaseTimeSelect
          v-if="settings.daily_report"
          v-model="settings.report_time"
          label="زمان ارسال گزارش"
          class="pt-3 mt-3 border-t border-token/50"
          placeholder="مثلاً 21:00"
      />
    </div>

    <!-- ✅ یادآوری تسک‌ها -->
    <div class="mb-6 p-4 surface rounded-xl border-l-4 border-[var(--color-accent)] shadow-sm space-y-4">
      <div class="flex items-start justify-between">
        <div class="flex flex-col gap-1">
          <h3 class="font-semibold text-[var(--color-heading)]">یادآوری انجام تسک‌ها</h3>
          <p class="text-[var(--color-text-secondary)] text-sm">اگر تسک‌ها تا زمان مشخصی انجام نشده باشند، یادآوری ارسال خواهد شد.</p>
        </div>
        <BaseCheckbox v-model="settings.task_reminder" />
      </div>
      <BaseTimeSelect
          v-if="settings.task_reminder"
          v-model="settings.task_reminder_time"
          label="زمان یادآوری"
          class="pt-3 mt-3 border-t border-token/50"
          placeholder="مثلاً 09:00"
      />
    </div>

    <!-- ✅ نوتیف پیشرفت لحظه‌ای -->
    <div class="mb-6 p-4 surface rounded-xl border-l-4 border-green-500 shadow-sm">
      <div class="flex items-start justify-between">
        <div class="flex flex-col gap-1">
          <h3 class="font-semibold text-[var(--color-heading)]">نوتیف پیشرفت لحظه‌ای</h3>
          <p class="text-[var(--color-text-secondary)] text-sm">بلافاصله پس از انجام هر تسک، نوتیف درصد پیشرفت دریافت کنید.</p>
        </div>
        <BaseCheckbox v-model="settings.per_task_progress" />
      </div>
    </div>

    <!-- دکمه ذخیره -->
    <button
        @click="save"
        class="w-full py-3 bg-[var(--color-primary)] text-white font-semibold rounded-2xl shadow-md hover:bg-[var(--color-primary-hover)] transition-all tap-target"
    >
      ذخیره تنظیمات
    </button>

  </div>
</template>
