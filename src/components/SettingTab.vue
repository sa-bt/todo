<template>
  <div class="max-w-2xl mx-auto mt-12 p-6 bg-white rounded-3xl shadow-xl">
    <h2 class="text-2xl font-bold mb-10 text-gray-800 text-center">تنظیمات نوتیفیکیشن</h2>

    <!-- کارت گزارش روزانه -->
    <div class="mb-6 p-6 bg-blue-50 rounded-2xl border-l-4 border-blue-500 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex items-center gap-3">
        <Calendar class="h-8 w-8 text-blue-500"/>
        <div>
          <h3 class="font-semibold text-gray-700">گزارش روزانه</h3>
          <p class="text-gray-500 text-sm">دریافت گزارش روزانه اهداف شما</p>
        </div>
      </div>
      <div class="flex flex-col md:flex-row md:items-center gap-4">
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="dailyReport" class="sr-only peer">
          <div class="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-500 transition-all duration-300"></div>
          <div class="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-md peer-checked:translate-x-full transition-transform duration-300"></div>
        </label>
        <input 
          type="time" 
          v-model="reportTime" 
          class="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition w-32 text-center"
        />
      </div>
    </div>

    <!-- کارت یادآوری تسک‌ها -->
    <div class="mb-6 p-6 bg-green-50 rounded-2xl border-l-4 border-green-500 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex items-center gap-3">
        <CheckSquare class="h-8 w-8 text-green-500"/>
        <div>
          <h3 class="font-semibold text-gray-700">یادآوری تسک‌ها</h3>
          <p class="text-gray-500 text-sm">یادآوری انجام تسک‌های امروز</p>
        </div>
      </div>
      <div class="flex flex-col md:flex-row md:items-center gap-4">
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="taskReminder" class="sr-only peer">
          <div class="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-all duration-300"></div>
          <div class="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-md peer-checked:translate-x-full transition-transform duration-300"></div>
        </label>
        <input 
          type="time" 
          v-model="taskReminderTime" 
          class="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition w-32 text-center"
        />
      </div>
    </div>

    <!-- وضعیت فعلی با معادل فارسی -->
    <div class="mb-4 text-center">
      <p>وضعیت فعلی نوتیفیکیشن: 
        <span :class="statusColor">{{ permissionLabels[notificationPermission] }}</span>
      </p>
    </div>

    <!-- دکمه فعال‌سازی و راهنمای فعال‌سازی فقط اگر permission فعال نیست -->
    <div v-if="notificationPermission !== 'granted'" class="text-center mb-4">
      <button v-if="notificationPermission === 'default'" @click="requestPermission" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
        فعال‌سازی نوتیفیکیشن
      </button>
      <button @click="showHelp = true" class="ml-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition">
        راهنمای فعال‌سازی
      </button>
    </div>

    <!-- دکمه ذخیره -->
    <button 
      @click="saveSetting" 
      class="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-2xl shadow-md hover:from-blue-700 hover:to-blue-600 transition-all mt-2">
      ذخیره تنظیمات
    </button>

    <!-- پیام نوتیفیکیشن داخلی -->
    <div v-if="notificationStore.message" 
         :class="['fixed top-5 right-5 px-4 py-2 rounded shadow-md z-50', 
                  notificationStore.type === 'success' ? 'bg-green-500 text-white' : 
                  notificationStore.type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white']">
      {{ notificationStore.message }}
    </div>

    <!-- Modal راهنمای فعال‌سازی بسته به پلتفرم -->
    <div v-if="showHelp && notificationPermission !== 'granted'" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
        <h2 class="text-xl font-bold mb-4">راهنمای فعال‌سازی نوتیفیکیشن</h2>

        <template v-if="!isPWA">
          <!-- مرورگر معمولی -->
          <p class="mb-4 text-sm">برای فعال کردن اعلان‌ها در مرورگر، مراحل زیر را دنبال کنید:</p>
          <ol class="list-decimal list-inside space-y-2 text-sm leading-relaxed">
            <li>روی آیکون 🔒 کنار نوار آدرس مرورگر کلیک کنید.</li>
            <li>به بخش <b>Site settings</b> بروید.</li>
            <li>گزینه <b>Notifications</b> را روی <b>Allow</b> قرار دهید.</li>
            <li>صفحه را رفرش کنید.</li>
          </ol>
        </template>

        <template v-else>
          <!-- PWA -->
          <p class="mb-4 text-sm">برای فعال کردن اعلان‌ها در PWA، مراحل زیر را دنبال کنید:</p>
          <ol class="list-decimal list-inside space-y-2 text-sm leading-relaxed">
            <li>به تنظیمات سیستم یا تنظیمات مرورگر PWA بروید.</li>
            <li>بخش Notifications را پیدا کنید.</li>
            <li>گزینه را روی <b>Allow</b> قرار دهید.</li>
            <li>برنامه را مجدداً باز کنید.</li>
          </ol>
        </template>

        <div class="flex justify-end gap-3 mt-6">
          <button @click="showHelp = false" class="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">
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

// تشخیص PWA
const isPWA = ref(false)
onMounted(() => {
  isPWA.value = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
})

// معادل فارسی مجوزها
const permissionLabels = {
  granted: 'فعال',
  denied: 'غیرفعال (بلاک شده)',
  default: 'نامشخص (نیاز به اجازه)',
}

// رنگ وضعیت
const statusColor = computed(() => {
  return {
    'text-gray-600': notificationPermission.value === 'default',
    'text-green-600': notificationPermission.value === 'granted',
    'text-red-600': notificationPermission.value === 'denied',
  }
})

// بارگذاری تنظیمات
async function loadSetting() {
  try {
    const res = await api.get('/user-setting')
    dailyReport.value = Boolean(res.data.daily_report)
    taskReminder.value = Boolean(res.data.task_reminder)
    reportTime.value = res.data.report_time.substring(0,5)
    taskReminderTime.value = res.data.task_reminder_time.substring(0,5)
  } catch(err) {
    console.error(err)
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
    showHelp.value = true
  }
}

// ذخیره تنظیمات
async function saveSetting() {
  try {
    await api.post('/user-setting', {
      daily_report: dailyReport.value ? 1 : 0,
      report_time: reportTime.value,
      task_reminder: taskReminder.value ? 1 : 0,
      task_reminder_time: taskReminderTime.value
    })

    notificationStore.setNotification('تنظیمات با موفقیت ذخیره شد ✅', 'success')

    if ((dailyReport.value || taskReminder.value) && notificationPermission.value === 'granted') {
      await registerWebPush()
    }

  } catch(err) {
    console.error(err)
    notificationStore.setNotification('خطا در ذخیره تنظیمات ❌', 'error')
  }
}

// WATCH روی توگل‌ها
watch([dailyReport, taskReminder], async ([daily, task]) => {
  if(daily || task) {
    if(notificationPermission.value === 'default') {
      const perm = await requestNotificationPermission()
      notificationPermission.value = perm
      if(perm === 'granted') {
        showHelp.value = false
        await registerWebPush()
      } else {
        showHelp.value = true
      }
    } else if(notificationPermission.value === 'granted') {
      await registerWebPush()
    } else {
      showHelp.value = true
    }
  }
})

onMounted(loadSetting)
</script>
