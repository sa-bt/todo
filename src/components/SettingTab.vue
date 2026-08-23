<script setup>
import { ref, onMounted, computed } from 'vue'
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

import { Volume2, Lock, TriangleAlert, X } from 'lucide-vue-next'
import PageHeader from '@/components/UI/PageHeader.vue'
import BaseButton from '@/components/UI/BaseButton.vue'

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
  granted: 'فعال',
  denied: 'مسدود شده',
  default: 'در انتظار اجازه',
}

// Status colour comes from the theme tokens so it stays legible in every theme.
const statusStyle = computed(() => {
  if (notificationPermission.value === 'granted') return { color: 'var(--color-success)', fontWeight: 700 }
  if (notificationPermission.value === 'denied') return { color: 'var(--color-danger)', fontWeight: 700 }
  return { color: 'var(--color-text-secondary)' }
})

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

    // ذخیره ناموفق نباید ادامه پیدا کند: ثبت اشتراک مرورگر برای تنظیماتی که
    // روی سرور ننشسته، وضعیت دستگاه را با وضعیت حساب ناهماهنگ می‌کند.
    // پیام خطا را خود استور نشان می‌دهد و مقدارهای واردشده کاربر دست‌نخورده
    // در فرم می‌مانند تا بتواند دوباره تلاش کند.
    const saved = await userSetting.save()

    if (!saved) return

    // ✅ ثبت webpush فقط اگر لازم بود
    if (needsPush.value && notificationPermission.value === 'granted') {
      await registerWebPush()
    }
  } finally {
    isSaving.value = false
  }
}

/*
 * درخواست مجوز مرورگر فقط با کلیک صریح روی همین دکمه انجام می‌شود.
 *
 * قبلاً یک watch روی همه سوئیچ‌ها بود که به‌محض روشن‌شدن هر گزینه، پنجره مجوز
 * مرورگر را ناگهانی باز می‌کرد. کاربر بدون اینکه بداند چرا لازم است با پرسش
 * مرورگر روبه‌رو می‌شد و رد کردنش مجوز را برای همیشه مسدود می‌کند. حالا به‌جای
 * آن، توضیح درون صفحه نشان داده می‌شود و تصمیم با خود کاربر است.
 */
async function requestPermission() {
  const permission = await requestNotificationPermission()
  notificationPermission.value = permission

  if (permission === 'granted') {
    showHelp.value = false

    notificationStore.setNotification({
      message: 'اعلان‌های مرورگر فعال شد.',
      type: 'success',
      icon: 'bell',
      duration: 4000,
    })

    await registerWebPush()

    return
  }

  notificationStore.setNotification({
    message: 'اجازه نمایش اعلان داده نشد.',
    type: 'error',
    icon: 'alert-triangle',
    duration: 4000,
  })
}

// گزینه‌هایی که بدون مجوز مرورگر عملاً کار نمی‌کنند.
const needsPush = computed(
  () =>
    dailyReport.value ||
    weeklyReport.value ||
    dropAlert.value ||
    taskReminder.value ||
    perTaskProgress.value,
)

// کاربر گزینه‌ای را روشن کرده که بدون مجوز بی‌اثر است. متن هشدار به وضعیت
// واقعی مجوز بستگی دارد، چون «هنوز اجازه نداده» و «مسدود کرده» دو کار متفاوت
// از کاربر می‌خواهند.
const permissionWarning = computed(() => {
  if (!needsPush.value || notificationPermission.value === 'granted') return null

  if (notificationPermission.value === 'denied') {
    return {
      title: 'اعلان‌های مرورگر مسدود شده‌اند',
      body: 'تنظیمات این بخش ذخیره می‌شوند، ولی تا وقتی مجوز مسدود است اعلانی روی این دستگاه نمایش داده نمی‌شود.',
      blocked: true,
    }
  }

  return {
    title: 'برای دریافت این اعلان‌ها به مجوز مرورگر نیاز است',
    body: 'بدون این مجوز تنظیمات ذخیره می‌شوند، ولی اعلانی روی این دستگاه نمایش داده نمی‌شود.',
    blocked: false,
  }
})

// بارگذاری اولیه تنظیمات
onMounted(loadSetting)
</script>

<template>
  <div class="page">
    <PageHeader title="تنظیمات" subtitle="اعلان‌ها، صدا و رنگ‌بندی گزارش‌ها." />

    <h2 class="text-base font-bold text-[var(--color-heading)]">اعلان‌ها</h2>

    <!-- ۱. گزارش روزانه -->
    <div class="p-4 surface rounded-2xl border border-token shadow-sm space-y-4">
      <div class="flex items-start justify-between">
        <div class="flex flex-col flex-1 gap-1">
          <h3 class="font-semibold text-[var(--color-heading)]">گزارش روزانه (ساعت مشخص)</h3>
          <p class="text-[var(--color-text-secondary)] text-sm">درصد انجام کارها و یک پیام انگیزشی در پایان روز فرستاده می‌شود.</p>
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
            class="pt-3 mt-3 border-t border-token"
            :disabled="!dailyReport"
        />
      </Transition>
    </div>

    <!-- ۲. گزارش هفتگی -->
    <div class="p-4 surface rounded-2xl border border-token shadow-sm space-y-4">
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
        <div v-if="weeklyReport" class="pt-3 mt-3 border-t border-token space-y-4">
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
    <div class="p-4 surface rounded-2xl border border-token shadow-sm space-y-4">
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

    <!-- ۴. یادآوری کارها -->
    <div class="p-4 surface rounded-2xl border border-token shadow-sm space-y-4">
      <div class="flex items-start justify-between">
        <div class="flex flex-col flex-1 gap-1">
          <h3 class="font-semibold text-[var(--color-heading)]">یادآوری کارها (ساعت مشخص)</h3>
          <p class="text-[var(--color-text-secondary)] text-sm">یادآوری برای کارهایی که تا ساعت مشخصی انجام نشده‌اند.</p>
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
            class="pt-3 mt-3 border-t border-token"
            :disabled="!taskReminder"
        />
      </Transition>
    </div>

    <!-- ۵. اعلان پیشرفت لحظه‌ای -->
    <div class="p-4 surface rounded-2xl border border-token shadow-sm">
      <div class="flex items-start justify-between">
        <div class="flex flex-col flex-1 gap-1">
          <h3 class="font-semibold text-[var(--color-heading)]">اعلان پیشرفت لحظه‌ای</h3>
          <p class="text-[var(--color-text-secondary)] text-sm">درصد پیشرفت امروز، بلافاصله پس از انجام هر کار.</p>
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
    <div class="p-4 surface rounded-2xl border border-token shadow-sm space-y-4">
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
             surface text-[var(--color-text)] hover-surface-soft
             transition disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="پخش نمونه صدا"
        >
          <Volume2 class="w-4 h-4" aria-hidden="true" />
          <span class="text-sm font-medium">پخش نمونه</span>
        </button>
      </div>
    </div>

    <!-- وضعیت مجوز نوتیفیکیشن مرورگر -->
    <div class="p-4 text-center surface rounded-2xl border border-token">
      <p class="text-[var(--color-text)] font-medium">وضعیت اعلان‌های مرورگر:
        <span :style="statusStyle" class="mr-1">
          {{ permissionLabels[notificationPermission] }}
        </span>
      </p>
    </div>

    <!--
      هشدار مجوز: فقط وقتی می‌آید که کاربر گزینه‌ای را روشن کرده باشد که بدون
      مجوز مرورگر بی‌اثر است. جای پنجره ناگهانی مرورگر را گرفته است.
    -->
    <div
      v-if="permissionWarning"
      class="flex items-start gap-3 p-4 rounded-2xl border permission-warning"
      :class="permissionWarning.blocked ? 'is-blocked' : 'is-pending'"
      role="status"
    >
      <span class="shrink-0 mt-0.5">
        <Lock v-if="permissionWarning.blocked" class="w-5 h-5" aria-hidden="true" />
        <TriangleAlert v-else class="w-5 h-5" aria-hidden="true" />
      </span>

      <div class="flex-1 min-w-0 space-y-1">
        <p class="font-semibold text-[var(--color-heading)]">{{ permissionWarning.title }}</p>
        <p class="text-sm text-[var(--color-text-secondary)] leading-6">{{ permissionWarning.body }}</p>
      </div>
    </div>

    <!-- دکمه‌های فعال‌سازی/راهنما -->
    <div v-if="notificationPermission !== 'granted'" class="flex flex-wrap justify-center gap-3">
      <BaseButton v-if="notificationPermission === 'default'" @click="requestPermission">
        فعال‌سازی اعلان‌ها
      </BaseButton>
      <BaseButton variant="ghost" @click="showHelp = true">راهنمای فعال‌سازی</BaseButton>
    </div>

    <!-- دکمه ذخیره -->
    <BaseButton size="lg" block :loading="isSaving" @click="saveSetting">
      {{ isSaving ? 'در حال ذخیره…' : 'ذخیره تنظیمات' }}
    </BaseButton>

    <!--
      رنگ‌بندی نتایج.
      جدا از دکمه ذخیره بالا است و دکمه ذخیره خودش را دارد، چون دو تنظیم بی‌ربط
      زیر یک دکمه کاربر را گمراه می‌کند.
    -->
    <div class="pt-6 border-t border-token">
      <h2 class="text-base font-bold mb-2 text-[var(--color-heading)]">رنگ‌بندی نتایج</h2>
      <p class="text-[var(--color-text-secondary)] text-sm mb-6">
        رنگ هر درصد بازدهی در گزارش‌ها. همین رنگ‌بندی در نقشه سالانه، هفته‌ها، ماه‌ها و کارت اهداف
        به کار می‌رود و روی همین مرورگر ذخیره می‌شود.
      </p>

      <PaletteEditor />
    </div>

    <!-- مودال راهنما -->
    <div v-if="showHelp" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div class="bg-[var(--color-background)] rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full border border-token text-[var(--color-text)]">
        <h2 class="text-lg font-bold mb-4 text-[var(--color-heading)]">راهنمای فعال‌سازی اعلان‌ها</h2>

        <p
          v-if="notificationPermission === 'denied'"
          class="mb-4 flex items-center gap-2 font-semibold"
          :style="{ color: 'var(--color-danger)' }"
        >
          <TriangleAlert class="w-4 h-4 shrink-0" aria-hidden="true" />
          اجازه نمایش اعلان در مرورگر مسدود شده است.
        </p>

        <p class="mb-4 text-sm">برای فعال کردن اعلان‌ها، اجازه را در تنظیمات مرورگر تغییر بده:</p>

        <ol class="list-decimal list-inside space-y-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          <li>
            روی
            <Lock class="inline-block w-3.5 h-3.5 -mt-0.5" aria-hidden="true" />
            آیکون قفل در نوار نشانی کلیک کن.
          </li>
          <li>به بخش تنظیمات سایت برو.</li>
          <li>گزینه اعلان‌ها را پیدا کن و روی «اجازه» بگذار.</li>
          <li>صفحه را دوباره بارگذاری کن.</li>
        </ol>

        <p v-if="isPWA" class="mt-4 text-xs text-[var(--color-text-secondary)]">
          اگر برنامه را روی دستگاه نصب کرده‌ای، اجازه اعلان را در تنظیمات خود دستگاه هم بررسی کن.
        </p>

        <div class="flex justify-end gap-3 mt-6">
          <BaseButton variant="ghost" @click="showHelp = false">
            <X class="w-4 h-4" aria-hidden="true" />
            بستن
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
 * هشدار مجوز. رنگ از توکن‌های تم می‌آید تا در پوسته روشن و تیره خوانا بماند، و
 * تفاوت دو حالت فقط رنگ نیست: آیکون قفل در برابر آیکون هشدار، و متن متفاوت.
 */
.permission-warning.is-pending {
  border-color: color-mix(in oklab, var(--color-warning) 35%, var(--color-border));
  background: color-mix(in oklab, var(--color-warning) 8%, var(--color-background));
  color: var(--color-warning);
}

.permission-warning.is-blocked {
  border-color: color-mix(in oklab, var(--color-danger) 35%, var(--color-border));
  background: color-mix(in oklab, var(--color-danger) 8%, var(--color-background));
  color: var(--color-danger);
}

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
