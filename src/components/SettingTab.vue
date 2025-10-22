<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import api from '@/plugins/axios'
import { registerWebPush, requestNotificationPermission } from '@/utils/webpush'

// ✅ کامپوننت‌های Base
import BaseCheckbox from '@/components/UI/BaseCheckbox.vue'
import BaseTimeSelect from '@/components/UI/BaseTimeSelect.vue'
import {useNotificationStore} from "../stores/notification.js";

const notificationStore = useNotificationStore()

// 💡 متغیرهای محلی که به v-model متصل هستند
const dailyReport = ref(false)
const reportTime = ref('08:00') // فرمت HH:MM
const taskReminder = ref(false)
const taskReminderTime = ref('09:00') // فرمت HH:MM
const perTaskProgress = ref(false)

const notificationPermission = ref(typeof Notification !== 'undefined' ? Notification.permission : 'denied')
const showHelp = ref(false)
const isSaving = ref(false)

// تشخیص PWA
const isPWA = ref(false)
onMounted(() => {
  if (typeof window !== 'undefined') {
    isPWA.value = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  }
})

// معادل فارسی مجوزها
const permissionLabels = {
  granted: 'فعال (مجوز داده شده)',
  denied: 'غیرفعال (مسدود شده)',
  default: 'نامشخص (نیاز به اجازه)',
}

// رنگ وضعیت نوتیفیکیشن
const statusColor = computed(() => {
  return {
    'text-[var(--color-text-secondary)]': notificationPermission.value === 'default',
    'text-green-500 font-bold': notificationPermission.value === 'granted',
    'text-red-500 font-bold': notificationPermission.value === 'denied',
  }
})

// ---------------------------------------------
// توابع API
// ---------------------------------------------

// بارگذاری تنظیمات
async function loadSetting() {
  try {
    // ✅ استفاده از روت صحیح /user-setting برای GET
    const res = await api.get('/user-setting')

    // 💡 اطمینان از مقداردهی اولیه به درستی
    const settings = res.data.data || res.data || {}

    dailyReport.value = Boolean(settings.daily_report ?? false)
    taskReminder.value = Boolean(settings.task_reminder ?? false)
    perTaskProgress.value = Boolean(settings.per_task_progress ?? false)

    // ✅ تبدیل HH:MM:SS (از دیتابیس) به HH:MM (برای v-model در BaseTimeSelect)
    reportTime.value = settings.report_time ? settings.report_time.substring(0, 5) : '08:00'
    taskReminderTime.value = settings.task_reminder_time ? settings.task_reminder_time.substring(0, 5) : '09:00'
  } catch(err) {
    console.error('Error loading settings:', err)
  }
}

// درخواست permission دوباره
async function requestPermission() {
  const permission = await requestNotificationPermission()
  notificationPermission.value = permission
  if(permission === 'granted') {
    showHelp.value = false
    notificationStore.setNotification('نوتیفیکیشن فعال شد', 'success')
    await registerWebPush()
  } else {
    notificationStore.setNotification('مجوز نوتیفیکیشن داده نشد', 'error')
    showHelp.value = true
  }
}

// ذخیره تنظیمات
async function saveSetting() {
  // اگر هرکدام از اعلان‌ها فعال بود، باید Web Push را ثبت کنیم.
  const needsWebPush = (dailyReport.value || taskReminder.value || perTaskProgress.value) && notificationPermission.value === 'granted'

  isSaving.value = true
  try {
    // ✅ استفاده از روت صحیح /user-setting برای POST
    await api.post('/user-setting', {
      daily_report: dailyReport.value, // Boolean
      report_time: reportTime.value,   // HH:MM
      task_reminder: taskReminder.value, // Boolean
      task_reminder_time: taskReminderTime.value, // HH:MM
      per_task_progress: perTaskProgress.value, // Boolean
    })

    if (needsWebPush) {
      await registerWebPush()
    }

    notificationStore.setNotification('تنظیمات با موفقیت ذخیره شد', 'success')

  } catch(err) {
    console.error('Error saving settings:', err)
    notificationStore.setNotification('خطا در ذخیره تنظیمات', 'error')
  } finally {
    isSaving.value = false
  }
}

// WATCH: اگر کاربر یکی از سوئیچ‌ها را فعال کرد و مجوز نداده بود.
watch([dailyReport, taskReminder, perTaskProgress], async ([daily, task, perTask]) => {
  if(daily || task || perTask) {
    if(notificationPermission.value === 'default') {
      const perm = await requestNotificationPermission()
      notificationPermission.value = perm
      if(perm !== 'granted') {
        showHelp.value = true
      }
    } else if(notificationPermission.value === 'denied') {
      showHelp.value = true
    }
  }
})

onMounted(loadSetting)
</script>

<template>
  <div class="max-w-2xl mx-auto mt-12 p-6 bg-[var(--color-background-soft)] rounded-3xl shadow-xl border border-token text-[var(--color-text)]">
    <h2 class="text-2xl font-bold mb-10 text-[var(--color-heading)] text-center">تنظیمات نوتیفیکیشن</h2>

    <!-- ۱. گزارش روزانه -->
    <div class="mb-6 p-4 surface rounded-2xl border-l-4 border-[var(--color-primary)] shadow-sm space-y-4">
      <div class="flex items-start justify-between">
        <div class="flex flex-col flex-1 gap-1">
          <h3 class="font-semibold text-[var(--color-heading)]">گزارش روزانه (ساعت مشخص)</h3>
          <p class="text-[var(--color-text-secondary)] text-sm">درصد تکمیل تسک‌ها و یک پیام انگیزشی در پایان روز ارسال شود.</p>
        </div>

        <!-- ✅ نمایش وضعیت (کپسول) + سوئیچ -->
        <div class="flex items-center gap-3 shrink-0">
          <BaseCheckbox
              v-model="dailyReport"
              name="daily_report_toggle"
              label=""
              class="w-fit h-fit p-0 m-0 !bg-transparent !border-0"
          />
        </div>
      </div>

      <Transition name="slide-fade-down">
        <BaseTimeSelect
            v-if="dailyReport"
            v-model="reportTime"
            name="report_time_select"
            label="زمان ارسال گزارش"
            placeholder="مثال: 21:00"
            class="pt-3 mt-3 border-t border-token/50"
            :disabled="!dailyReport"
        />
      </Transition>
    </div>

    <!-- ۲. یادآوری تسک‌ها -->
    <div class="mb-6 p-4 surface rounded-2xl border-l-4 border-[var(--color-accent)] shadow-sm space-y-4">
      <div class="flex items-start justify-between">
        <div class="flex flex-col flex-1 gap-1">
          <h3 class="font-semibold text-[var(--color-heading)]">یادآوری تسک‌ها (ساعت مشخص)</h3>
          <p class="text-[var(--color-text-secondary)] text-sm">یادآوری برای تسک‌هایی که هنوز تا زمان مشخصی انجام نشده‌اند.</p>
        </div>

        <!-- ✅ نمایش وضعیت (کپسول) + سوئیچ -->
        <div class="flex items-center gap-3 shrink-0">
          <BaseCheckbox
              v-model="taskReminder"
              name="task_reminder_toggle"
              label=""
              class="w-fit h-fit p-0 m-0 !bg-transparent !border-0"
          />
        </div>
      </div>

      <Transition name="slide-fade-down">
        <BaseTimeSelect
            v-if="taskReminder"
            v-model="taskReminderTime"
            name="reminder_time_select"
            label="زمان ارسال یادآوری"
            placeholder="مثال: 17:00"
            class="pt-3 mt-3 border-t border-token/50"
            :disabled="!taskReminder"
        />
      </Transition>
    </div>

    <!-- ۳. اعلان پیشرفت لحظه‌ای -->
    <div class="mb-6 p-4 surface rounded-2xl border-l-4 border-green-500 shadow-sm">
      <div class="flex items-start justify-between">
        <div class="flex flex-col flex-1 gap-1">
          <h3 class="font-semibold text-[var(--color-heading)]">نوتیف پیشرفت لحظه‌ای</h3>
          <p class="text-[var(--color-text-secondary)] text-sm">دریافت درصد پیشرفت امروز، بلافاصله پس از تکمیل هر تسک.</p>
        </div>

        <!-- ✅ نمایش وضعیت (کپسول) + سوئیچ -->
        <div class="flex items-center gap-3 shrink-0">
          <BaseCheckbox
              v-model="perTaskProgress"
              name="per_task_progress_toggle"
              label=""
              class="w-fit h-fit p-0 m-0 !bg-transparent !border-0"
          />
        </div>
      </div>
    </div>

    <!-- وضعیت مجوز نوتیفیکیشن مرورگر -->
    <div class="mb-6 p-4 text-center surface rounded-xl border border-token">
      <p class="text-[var(--color-text)] font-medium">وضعیت فعلی نوتیفیکیشن:
        <span :class="statusColor" class="mr-1">
          {{ permissionLabels[notificationPermission] }}
        </span>
      </p>
    </div>

    <!-- دکمه‌های فعال‌سازی/راهنما -->
    <div v-if="notificationPermission !== 'granted'" class="text-center mb-6 flex justify-center gap-4">
      <button v-if="notificationPermission === 'default'" @click="requestPermission" class="tap-target px-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:bg-[var(--color-primary-hover)] transition">
        فعال‌سازی نوتیفیکیشن
      </button>
      <button @click="showHelp = true" class="tap-target px-6 py-3 bg-[var(--color-background)] text-[var(--color-text)] font-semibold rounded-xl hover:bg-[var(--color-background-soft-hover)] transition border border-token">
        راهنمای فعال‌سازی
      </button>
    </div>

    <!-- دکمه ذخیره -->
    <button
        @click="saveSetting"
        :disabled="isSaving"
        class="w-full py-3 bg-[var(--color-primary)] text-white font-semibold rounded-2xl shadow-md hover:bg-[var(--color-primary-hover)] transition-all tap-target inline-flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed">
      <span v-if="isSaving"
            class="animate-spin border-2 border-white border-t-transparent w-5 h-5 rounded-full"
            aria-hidden="true">
      </span>
      {{ isSaving ? 'در حال ذخیره...' : 'ذخیره تنظیمات' }}
    </button>

    <!-- مودال راهنما -->
    <div v-if="showHelp" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div class="bg-[var(--color-background)] rounded-2xl shadow-2xl p-8 max-w-md w-full border border-token text-[var(--color-text)]">
        <h2 class="text-xl font-bold mb-4 text-[var(--color-heading)]">راهنمای فعال‌سازی نوتیفیکیشن</h2>

        <template v-if="notificationPermission === 'denied'">
          <p class="text-red-500 mb-4 font-semibold">🚨 مجوز دسترسی به نوتیفیکیشن توسط شما مسدود شده است.</p>
        </template>

        <p class="mb-4 text-sm">برای فعال کردن اعلان‌ها، لطفاً مجوز را در تنظیمات مرورگر/سیستم عامل خود تغییر دهید:</p>

        <ol class="list-decimal list-inside space-y-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          <li>روی **آیکون قفل** (🔒) در نوار آدرس کلیک کنید.</li>
          <li>به بخش <b>تنظیمات سایت (Site settings)</b> بروید.</li>
          <li>گزینه <b>نوتیفیکیشن‌ها (Notifications)</b> را پیدا کنید و روی **اجازه (Allow)** تنظیم کنید.</li>
          <li>صفحه را **رفرش (Reload)** کنید.</li>
        </ol>

        <p v-if="isPWA" class="mt-4 text-xs italic text-[var(--color-text-secondary)]">
          اگر از PWA استفاده می‌کنید، ممکن است لازم باشد مجوز را در تنظیمات نوتیفیکیشن خود سیستم عامل (مانند گوشی) نیز بررسی کنید.
        </p>

        <div class="flex justify-end gap-3 mt-6">
          <button @click="showHelp = false" class="tap-target px-4 py-2 rounded-xl bg-[var(--color-background-soft)] hover:bg-[var(--color-background-soft-hover)] text-[var(--color-text)] border border-token">
            بستن
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ترنزیشن برای باز و بسته شدن BaseTimeSelect زیر سوئیچ */
.slide-fade-down-enter-active,
.slide-fade-down-leave-active {
  transition: all 0.3s ease-out;
  overflow: hidden;
}

.slide-fade-down-enter-from,
.slide-fade-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.slide-fade-down-enter-to,
.slide-fade-down-leave-from {
  max-height: 200px; /* یک ارتفاع کافی برای transition */
}
</style>
