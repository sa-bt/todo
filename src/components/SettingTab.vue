<template>
  <div class="max-w-2xl mx-auto mt-12 p-6 bg-[var(--color-background-soft)] rounded-3xl shadow-xl border border-token text-[var(--color-text)]">
    <h2 class="text-2xl font-bold mb-10 text-[var(--color-heading)] text-center">تنظیمات نوتیفیکیشن</h2>

    <div class="mb-6 p-6 bg-[var(--color-background)] rounded-2xl border-l-4 border-[var(--color-primary)] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex items-center gap-3">
        <Calendar class="h-8 w-8 text-[var(--color-primary)]"/>
        <div>
          <h3 class="font-semibold text-[var(--color-heading)]">گزارش روزانه</h3>
          <p class="text-text-secondary text-sm">دریافت گزارش روزانه اهداف شما</p>
        </div>
      </div>
      <div class="flex flex-col md:flex-row md:items-center gap-4">
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="dailyReport" class="sr-only peer">
          <div :class="['w-12 h-6 rounded-full peer transition-all duration-300', dailyReport ? 'bg-[var(--color-primary)]' : 'bg-gray-300']"></div>
          <div class="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-md peer-checked:translate-x-full transition-transform duration-300"></div>
        </label>
        <input
            type="time"
            v-model="reportTime"
            :disabled="!dailyReport"
            :class="['border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] transition w-32 text-center card-bg text-[var(--color-text)]', !dailyReport && 'opacity-50 cursor-not-allowed']"
        />
      </div>
    </div>

    <div class="mb-6 p-6 bg-[var(--color-background)] rounded-2xl border-l-4 border-[var(--color-accent)] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex items-center gap-3">
        <CheckSquare class="h-8 w-8 text-[var(--color-accent)]"/>
        <div>
          <h3 class="font-semibold text-[var(--color-heading)]">یادآوری تسک‌ها</h3>
          <p class="text-text-secondary text-sm">یادآوری انجام تسک‌های امروز</p>
        </div>
      </div>
      <div class="flex flex-col md:flex-row md:items-center gap-4">
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="taskReminder" class="sr-only peer">
          <div :class="['w-12 h-6 rounded-full peer transition-all duration-300', taskReminder ? 'bg-[var(--color-accent)]' : 'bg-gray-300']"></div>
          <div class="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-md peer-checked:translate-x-full transition-transform duration-300"></div>
        </label>
        <input
            type="time"
            v-model="taskReminderTime"
            :disabled="!taskReminder"
            :class="['border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition w-32 text-center card-bg text-[var(--color-text)]', !taskReminder && 'opacity-50 cursor-not-allowed']"
        />
      </div>
    </div>

    <div class="mb-4 text-center">
      <p class="text-[var(--color-text)]">وضعیت فعلی نوتیفیکیشن:
        <span :class="statusColor">{{ permissionLabels[notificationPermission] }}</span>
      </p>
    </div>

    <div v-if="notificationPermission !== 'granted'" class="text-center mb-4">
      <button v-if="notificationPermission === 'default'" @click="requestPermission" class="tap-target px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] transition">
        فعال‌سازی نوتیفیکیشن
      </button>
      <button @click="showHelp = true" class="tap-target ml-2 px-4 py-2 bg-[var(--color-background-soft)] text-[var(--color-text)] rounded-lg hover:bg-[var(--color-background-soft-hover)] transition border border-token">
        راهنمای فعال‌سازی
      </button>
    </div>

    <button
        @click="saveSetting"
        :disabled="isSaving"
        class="w-full py-3 bg-[var(--color-primary)] text-white font-semibold rounded-2xl shadow-md hover:bg-[var(--color-primary-hover)] transition-all mt-2 tap-target inline-flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
      <span v-if="isSaving"
            class="animate-spin border-2 border-white border-t-transparent w-4 h-4 rounded-full"
            aria-hidden="true">
      </span>
      {{ isSaving ? 'در حال ذخیره...' : 'ذخیره تنظیمات' }}
    </button>

    <div v-if="showHelp" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-[var(--color-background-soft)] rounded-2xl shadow-lg p-6 max-w-md w-full border border-token text-[var(--color-text)]">
        <h2 class="text-xl font-bold mb-4 text-[var(--color-heading)]">راهنمای فعال‌سازی نوتیفیکیشن</h2>

        <template v-if="!isPWA">
          <p class="mb-4 text-sm">برای فعال کردن اعلان‌ها در **مرورگر رومیزی**، مراحل زیر را دنبال کنید:</p>
          <ol class="list-decimal list-inside space-y-2 text-sm leading-relaxed">
            <li>روی آیکون 🔒 کنار نوار آدرس مرورگر کلیک کنید.</li>
            <li>به بخش <b>تنظیمات سایت (Site settings)</b> بروید.</li>
            <li>گزینه <b>نوتیفیکیشن‌ها (Notifications)</b> را روی **اجازه (Allow)** قرار دهید.</li>
            <li>صفحه را رفرش کنید.</li>
          </ol>
        </template>

        <template v-else>
          <p class="mb-4 text-sm">برای فعال کردن اعلان‌ها در **اپلیکیشن PWA**، مراحل زیر را دنبال کنید:</p>
          <ol class="list-decimal list-inside space-y-2 text-sm leading-relaxed">
            <li>به تنظیمات سیستم عامل خود (اندروید/iOS/دسکتاپ) بروید.</li>
            <li>بخش **Notifications** را پیدا کنید.</li>
            <li>مجوز اعلان‌ها را برای نام این اپلیکیشن روی **فعال** قرار دهید.</li>
            <li>برنامه را مجدداً باز کنید.</li>
          </ol>
        </template>

        <div class="flex justify-end gap-3 mt-6">
          <button @click="showHelp = false" class="tap-target px-4 py-2 rounded-lg bg-[var(--color-background)] hover:bg-[var(--color-background-soft-hover)] text-[var(--color-text)] border border-token">
            بستن
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import api from '@/plugins/axios'
import { Calendar, CheckSquare } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/toast'
import { registerWebPush, requestNotificationPermission } from '@/utils/webpush'

const notificationStore = useNotificationStore()

const dailyReport = ref(false)
const reportTime = ref('08:00')
const taskReminder = ref(false)
const taskReminderTime = ref('09:00')
const notificationPermission = ref(Notification.permission)
const showHelp = ref(false)
const isSaving = ref(false) // ✅ متغیر جدید

// تشخیص PWA
const isPWA = ref(false)
onMounted(() => {
  isPWA.value = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
})

// معادل فارسی مجوزها
const permissionLabels = {
  granted: 'فعال (مجوز داده شده)',
  denied: 'غیرفعال (مسدود شده)',
  default: 'نامشخص (نیاز به اجازه)',
}

// رنگ وضعیت
const statusColor = computed(() => {
  return {
    'text-gray-500': notificationPermission.value === 'default',
    'text-green-600 font-bold': notificationPermission.value === 'granted',
    'text-red-600 font-bold': notificationPermission.value === 'denied',
  }
})

// بارگذاری تنظیمات
async function loadSetting() {
  try {
    const res = await api.get('/user-setting')
    dailyReport.value = Boolean(res.data.daily_report)
    taskReminder.value = Boolean(res.data.task_reminder)
    reportTime.value = (res.data.report_time || '08:00').substring(0,5)
    taskReminderTime.value = (res.data.task_reminder_time || '09:00').substring(0,5)
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
    notificationStore.setNotification('نوتیفیکیشن فعال شد ✅', 'success')
    await registerWebPush()
  } else {
    notificationStore.setNotification('مجوز نوتیفیکیشن داده نشد ❌', 'error')
    showHelp.value = true
  }
}

// ذخیره تنظیمات
async function saveSetting() {
  const needsWebPush = (dailyReport.value || taskReminder.value) && notificationPermission.value === 'granted'

  isSaving.value = true // ✅ شروع لودینگ
  try {
    await api.post('/user-setting', {
      daily_report: dailyReport.value ? 1 : 0,
      report_time: reportTime.value,
      task_reminder: taskReminder.value ? 1 : 0,
      task_reminder_time: taskReminderTime.value
    })

    if (needsWebPush) {
      await registerWebPush()
    }

    notificationStore.setNotification('تنظیمات با موفقیت ذخیره شد ✅', 'success')

  } catch(err) {
    console.error('Error saving settings:', err)
    notificationStore.setNotification('خطا در ذخیره تنظیمات ❌', 'error')
  } finally {
    isSaving.value = false // ✅ پایان لودینگ
  }
}

// WATCH روی توگل‌ها
watch([dailyReport, taskReminder], async ([daily, task]) => {
  if(daily || task) {
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
