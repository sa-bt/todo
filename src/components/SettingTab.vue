<template>
  <div class="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-3xl shadow-2xl">
    <h2 class="text-3xl font-bold mb-8 text-gray-800 text-center">تنظیمات نوتیفیکیشن</h2>

    <!-- کارت گزارش روزانه -->
    <div class="mb-6 p-5 bg-blue-50 rounded-2xl border-l-4 border-blue-500 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
          <div class="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-500 transition-all duration-300"></div>
          <div class="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-md peer-checked:translate-x-full transition-transform duration-300"></div>
        </label>
        <input type="time" v-model="reportTime" class="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"/>
      </div>
      <p v-if="dailyReport" class="mt-2 md:mt-0 text-sm text-blue-600">
        ⏰ گزارش روزانه هر روز ساعت {{ reportTime }} ارسال خواهد شد
      </p>
    </div>

    <!-- کارت یادآوری تسک‌ها -->
    <div class="mb-6 p-5 bg-green-50 rounded-2xl border-l-4 border-green-500 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
          <div class="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-all duration-300"></div>
          <div class="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-md peer-checked:translate-x-full transition-transform duration-300"></div>
        </label>
        <input type="time" v-model="taskReminderTime" class="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"/>
      </div>
      <p v-if="taskReminder" class="mt-2 md:mt-0 text-sm text-green-600">
        ⏰ یادآوری انجام تسک‌ها هر روز ساعت {{ taskReminderTime }} ارسال خواهد شد
      </p>
    </div>

    <!-- دکمه ذخیره -->
    <button 
      @click="saveSetting" 
      class="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-2xl shadow-lg hover:from-blue-700 hover:to-blue-600 transition-all mt-2">
      ذخیره تنظیمات
    </button>

    <!-- نمایش پیام با Pinia Store -->
    <div v-if="notificationStore.message" 
         :class="['fixed top-5 right-5 px-4 py-2 rounded shadow-md z-50', 
                  notificationStore.type === 'success' ? 'bg-green-500 text-white' : 
                  notificationStore.type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white']">
      {{ notificationStore.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/plugins/axios'
import { Calendar, CheckSquare } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/toast'

const notificationStore = useNotificationStore()

const dailyReport = ref(false)
const reportTime = ref('08:00')
const taskReminder = ref(false)
const taskReminderTime = ref('09:00')

// بارگذاری تنظیمات از سرور
async function loadSetting() {
  try {
    const res = await api.get('/user-setting')
    dailyReport.value = res.data.daily_report
    reportTime.value = res.data.report_time.substring(0,5)
    taskReminder.value = res.data.task_reminder
    taskReminderTime.value = res.data.task_reminder_time.substring(0,5)
  } catch(err) {
    console.error(err)
  }
}

// ذخیره تنظیمات روی سرور با نمایش پیام
async function saveSetting() {
  try {
    await api.post('/user-setting', {
      daily_report: dailyReport.value,
      report_time: reportTime.value,
      task_reminder: taskReminder.value,
      task_reminder_time: taskReminderTime.value
    })

    notificationStore.setNotification('تنظیمات با موفقیت ذخیره شد ✅', 'success')
  } catch(err) {
    console.error(err)
    notificationStore.setNotification('خطا در ذخیره تنظیمات ❌', 'error')
  }
}

onMounted(loadSetting)
</script>
