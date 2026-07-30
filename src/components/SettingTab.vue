<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { registerWebPush, requestNotificationPermission } from '@/utils/webpush'

// ✅ استورها
import { useNotificationStore } from '@/stores/notification'
import { useUserSettingStore } from '@/stores/userSetting'
import { useToastSoundStore } from '@/stores/toastSound'

// ✅ کامپوننت‌های Base
import PaletteEditor from '@/components/Activity/PaletteEditor.vue'
import BaseCheckbox from '@/components/UI/BaseCheckbox.vue'
import BaseTimeSelect from '@/components/UI/BaseTimeSelect.vue'
import BaseSelect from '@/components/UI/BaseSelect.vue'

import { Volume2 } from 'lucide-vue-next'

const notificationStore = useNotificationStore()
const userSetting = useUserSettingStore()
const toastSound = useToastSoundStore()

/*
| صدای اعلان روی همین دستگاه ذخیره می‌شود، پس مستقل از دکمه ذخیره است
| و با هر تغییر بلافاصله اعمال و یک‌بار پخش می‌شود.
*/
const selectedSound = computed({
  get: () => toastSound.current,
  set: (value) => {
    toastSound.setSound(value)
    toastSound.play()
  },
})

// 💡 اتصال مستقیم state استور به v-modelها
const dailyReport = ref(false)
const reportTime = ref('08:00')
const taskReminder = ref(false)
const taskReminderTime = ref('09:00')
const perTaskProgress = ref(false)
const weeklyReport = ref(false)
const weeklyReportDay = ref(6)
const weeklyReportTime = ref('20:00')
const dropAlert = ref(false)

// شنبه صفر است و جمعه شش، همان شماره‌گذاری نمودار روزهای هفته در صفحه گزارش.
const weekDayOptions = [
  { value: 0, label: 'شنبه' },
  { value: 1, label: 'یک‌شنبه' },
  { value: 2, label: 'دوشنبه' },
  { value: 3, label: 'سه‌شنبه' },
  { value: 4, label: 'چهارشنبه' },
  { value: 5, label: 'پنج‌شنبه' },
  { value: 6, label: 'جمعه' },
]

const notificationPermission = ref(typeof Notification !== 'undefined' ? Notification.permission : 'denied')
const showHelp = ref(false)
const isSaving = ref(false)
const isPWA = ref(false)

// تشخیص PWA
onMounted(() => {
  if (typeof window !== 'undefined') {
    isPWA.value = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  }
})

// برچسب فارسی مجوزها
const permissionLabels = {
  granted: 'فعال (مجوز داده شده)',
  denied: 'غیرفعال (مسدود شده)',
  default: 'نامشخص (نیاز به اجازه)',
}

const statusColor = computed(() => ({
  'text-[var(--color-text-secondary)]': notificationPermission.value === 'default',
  'text-green-500 font-bold': notificationPermission.value === 'granted',
  'text-red-500 font-bold': notificationPermission.value === 'denied',
}))

// ---------------------------------------------
// 🔹 توابع تعامل با استور
// ---------------------------------------------

// بارگذاری از استور
async function loadSetting() {
  await userSetting.load()

  // مقداردهی به local refs از state استور
  dailyReport.value = userSetting.daily_report
  taskReminder.value = userSetting.task_reminder
  perTaskProgress.value = userSetting.per_task_progress
  reportTime.value = userSetting.report_time
  taskReminderTime.value = userSetting.task_reminder_time
  weeklyReport.value = userSetting.weekly_report
  weeklyReportDay.value = userSetting.weekly_report_day
  weeklyReportTime.value = userSetting.weekly_report_time
  dropAlert.value = userSetting.drop_alert
}

// ذخیره تنظیمات از طریق استور
async function saveSetting() {
  isSaving.value = true
  try {
    // sync داده‌های local با استور
    userSetting.daily_report = dailyReport.value
    userSetting.task_reminder = taskReminder.value
    userSetting.per_task_progress = perTaskProgress.value
    userSetting.report_time = reportTime.value
    userSetting.task_reminder_time = taskReminderTime.value
    userSetting.weekly_report = weeklyReport.value
    userSetting.weekly_report_day = weeklyReportDay.value
    userSetting.weekly_report_time = weeklyReportTime.value
    userSetting.drop_alert = dropAlert.value

    await userSetting.save()

    // ✅ ثبت webpush فقط اگر لازم بود
    const needsWebPush =
        (dailyReport.value || weeklyReport.value || dropAlert.value || taskReminder.value || perTaskProgress.value) &&
        notificationPermission.value === 'granted'

    if (needsWebPush) await registerWebPush()
  } finally {
    isSaving.value = false
  }
}

// درخواست مجوز مرورگر
async function requestPermission() {
  const permission = await requestNotificationPermission()
  notificationPermission.value = permission
  if (permission === 'granted') {
    showHelp.value = false
    notificationStore.setNotification('نوتیفیکیشن فعال شد', 'success')
    await registerWebPush()
  } else {
    notificationStore.setNotification('مجوز نوتیفیکیشن داده نشد', 'error')
    showHelp.value = true
  }
}

// Watch برای فعال‌سازی مجوزها در صورت نیاز
watch([dailyReport, weeklyReport, dropAlert, taskReminder, perTaskProgress], async ([daily, weekly, drop, task, per]) => {
  if (daily || weekly || drop || task || per) {
    if (notificationPermission.value === 'default') {
      const perm = await requestNotificationPermission()
      notificationPermission.value = perm
      if (perm !== 'granted') showHelp.value = true
    } else if (notificationPermission.value === 'denied') {
      showHelp.value = true
    }
  }
})

// بارگذاری اولیه تنظیمات
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

    <!-- ۲. گزارش هفتگی -->
    <div class="mb-6 p-4 surface rounded-2xl border-l-4 border-[var(--color-secondary)] shadow-sm space-y-4">
      <div class="flex items-start justify-between">
        <div class="flex flex-col flex-1 gap-1">
          <h3 class="font-semibold text-[var(--color-heading)]">گزارش هفتگی</h3>
          <p class="text-[var(--color-text-secondary)] text-sm">جمع‌بندی هفت روز گذشته، همراه با مقایسه با هفته قبل.</p>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <BaseCheckbox
              v-model="weeklyReport"
              name="weekly_report_toggle"
              label=""
              class="w-fit h-fit p-0 m-0 !bg-transparent !border-0"
          />
        </div>
      </div>

      <Transition name="slide-fade-down">
        <div v-if="weeklyReport" class="pt-3 mt-3 border-t border-token/50 space-y-4">
          <div class="flex flex-col gap-1">
            <span class="text-sm text-[var(--color-text-secondary)]">روز ارسال</span>
            <BaseSelect
                v-model="weeklyReportDay"
                name="weekly_report_day_select"
                :options="weekDayOptions"
            />
          </div>

          <BaseTimeSelect
              v-model="weeklyReportTime"
              name="weekly_report_time_select"
              label="زمان ارسال گزارش"
              placeholder="مثال: 20:00"
          />
        </div>
      </Transition>
    </div>

    <!-- ۳. هشدار افت -->
    <div class="mb-6 p-4 surface rounded-2xl border-l-4 border-[var(--color-secondary)] shadow-sm space-y-4">
      <div class="flex items-start justify-between">
        <div class="flex flex-col flex-1 gap-1">
          <h3 class="font-semibold text-[var(--color-heading)]">هشدار افت</h3>
          <p class="text-[var(--color-text-secondary)] text-sm">
            اگر بازدهی‌ات دو هفته پیاپی پایین بیاید، شنبه صبح یک یادآوری کوتاه می‌گیری.
            حداکثر هر دو هفته یک بار.
          </p>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <BaseCheckbox
              v-model="dropAlert"
              name="drop_alert_toggle"
              label=""
              class="w-fit h-fit p-0 m-0 !bg-transparent !border-0"
          />
        </div>
      </div>
    </div>

    <!-- ۴. یادآوری تسک‌ها -->
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

    <!-- ۵. اعلان پیشرفت لحظه‌ای -->
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

    <!-- ۶. صدای اعلان‌های داخل برنامه -->
    <div class="mb-6 p-4 surface rounded-2xl border-l-4 border-purple-500 shadow-sm space-y-4">
      <div class="flex flex-col gap-1">
        <h3 class="font-semibold text-[var(--color-heading)]">صدای اعلان</h3>
        <p class="text-[var(--color-text-secondary)] text-sm">
          صدایی که هنگام نمایش پیام‌های داخل برنامه پخش می‌شود. این انتخاب روی همین دستگاه ذخیره می‌شود و نیازی به دکمه ذخیره ندارد.
        </p>
      </div>

      <div class="flex items-end gap-3">
        <BaseSelect
            v-model="selectedSound"
            name="toast_sound_select"
            :options="toastSound.options"
            class="flex-1"
        />

        <button
            type="button"
            @click="toastSound.play()"
            :disabled="toastSound.isMuted"
            class="tap-target shrink-0 inline-flex items-center gap-2 px-4 min-h-[42px] rounded-xl border border-token
             bg-[var(--color-background)] text-[var(--color-text)] hover:bg-[var(--color-background-soft)]
             transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="پخش نمونه صدا"
        >
          <Volume2 class="w-4 h-4" aria-hidden="true" />
          <span class="text-sm font-medium">پخش نمونه</span>
        </button>
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

    <!--
      رنگ‌بندی نتایج.
      جدا از دکمه ذخیره بالا است و دکمه ذخیره خودش را دارد، چون دو تنظیم بی‌ربط
      زیر یک دکمه کاربر را گمراه می‌کند.
    -->
    <div class="mt-10 pt-8 border-t border-token">
      <h2 class="text-2xl font-bold mb-2 text-[var(--color-heading)] text-center">رنگ‌بندی نتایج</h2>
      <p class="text-[var(--color-text-secondary)] text-sm text-center mb-6">
        رنگ هر درصد بازدهی در گزارش‌ها. همین رنگ‌بندی در نقشه سالانه، هفته‌ها، ماه‌ها و کارت اهداف
        به کار می‌رود و روی همین مرورگر ذخیره می‌شود.
      </p>

      <PaletteEditor />
    </div>

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
