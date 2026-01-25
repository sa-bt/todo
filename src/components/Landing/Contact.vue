<template>
  <!-- اضافه کردن ایونت موس برای افکت اشعه -->
  <section id="contact" class="surface py-20 md:py-32 scroll-mt-40 overflow-hidden" @mousemove="handleMouseMove">
    <div class="container mx-auto px-6">
      <div class="max-w-4xl mx-auto relative z-10">

        <!-- عنوان -->
        <h2
          class="text-3xl md:text-5xl font-extrabold text-[var(--color-heading)] text-center mb-6"
          data-aos="fade-up"
        >
          {{ t('contact.title') }}
        </h2>
        <p
          class="max-w-2xl mx-auto text-center text-[var(--color-text-secondary)] leading-relaxed mb-16"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          {{ t('contact.text') }}
        </p>

        <!-- باکس فرم (با Paper Effect و Spotlight) -->
        <div
          class="spotlight-card surface-soft p-8 md:p-12 rounded-2xl border-token shadow-xl relative"
          data-aos="fade-up"
          data-aos-delay="200"
          style="
            box-shadow:
              inset 0 1px 0 0 rgba(255, 255, 255, 0.6),
              inset 0 -1px 0 0 rgba(0, 0, 0, 0.05),
              0 10px 15px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -2px rgba(0, 0, 0, 0.05);
          "
        >

          <!-- پیام موفقیت -->
          <div v-if="success" class="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-background)] z-20 transition-all duration-500 animate-fade-in-up rounded-2xl">
            <div class="w-24 h-24 rounded-full bg-green-100 text-green-500 flex items-center justify-center mb-6 shadow-lg">
              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 class="text-2xl font-bold text-[var(--color-heading)] mb-2">پیام شما ارسال شد!</h3>
            <p class="text-[var(--color-text-secondary)] text-center max-w-md">از اینکه وقت گذاشتید و با ما در ارتباط بودید سپاسگزاریم. ما در اسرع وقت پاسخ شما را خواهیم داد.</p>
            <button @click="resetForm" class="mt-8 px-6 py-2 rounded-lg bg-[var(--color-background-mute)] hover:bg-[var(--color-border)] transition text-[var(--color-text)] font-medium">
              ارسال پیام جدید
            </button>
          </div>

          <!-- نمایش خطای کلی سرور -->
          <transition name="slide-fade">
            <div v-if="errorMessages.length" class="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 flex items-start gap-3">
              <svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <ul class="list-disc mr-2 space-y-1 text-right text-sm">
                <li v-for="(msg, i) in errorMessages" :key="i">{{ msg }}</li>
              </ul>
            </div>
          </transition>

          <form @submit.prevent="submitForm" :class="{ 'opacity-50 pointer-events-none blur-sm': success }">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

              <!-- نام -->
              <div class="relative group">
                <input
                  v-model="form.name"
                  id="input-name"
                  type="text"
                  :placeholder="!form.name ? t('contact.name') : ''"
                  :class="inputWrapperClass('name')"
                />
                <div class="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-primary)] transition-colors pointer-events-none">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <p v-if="fieldErrors.name" class="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {{ fieldErrors.name }}
                </p>
              </div>

              <!-- ایمیل -->
              <div class="relative group">
                <input
                  v-model="form.email"
                  id="input-email"
                  type="email"
                  :placeholder="!form.email ? t('contact.email') : ''"
                  :class="['pr-10 pl-10', inputWrapperClass('email')]"
                />
                <div class="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-primary)] transition-colors pointer-events-none">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                </div>

                <!-- آیکون وضعیت ایمیل -->
                <div class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg v-if="emailValidationStatus === null" class="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <svg v-else-if="emailValidationStatus === true" class="w-5 h-5 text-green-500 animate-scale-in" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <svg v-else class="w-5 h-5 text-red-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12 a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>

                <p v-if="fieldErrors.email" class="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {{ fieldErrors.email }}
                </p>
              </div>
            </div>

            <!-- پیام -->
            <div class="relative group mb-8">
              <textarea
                v-model="form.message"
                id="input-message"
                rows="4"
                :placeholder="!form.message ? t('contact.message') : ''"
                :class="inputWrapperClass('message')"
              ></textarea>
              <div class="absolute right-4 top-4 text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-primary)] transition-colors pointer-events-none">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              </div>
              <p v-if="fieldErrors.message" class="mt-1 text-xs text-red-500 flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {{ fieldErrors.message }}
              </p>
            </div>

            <!-- بخش کپچا -->
            <div class="mb-8 flex flex-col md:flex-row gap-6 items-center bg-[var(--color-background-mute)]/50 p-4 rounded-2xl border border-dashed border-[var(--color-border)]">

              <!-- تصویر کپچا -->
              <div class="relative group overflow-hidden rounded-xl shadow-sm border border-[var(--color-border)] bg-white cursor-pointer" @click="refreshCaptcha">
                <img
                  :key="captcha.id"
                  v-if="captcha.image"
                  :src="captcha.image"
                  alt="captcha"
                  class="block w-[200px] h-[70px] object-contain select-none transition-transform group-hover:scale-105"
                  draggable="false"
                />
                <div v-else class="w-[200px] h-[70px] grid place-items-center text-gray-400">
                  <svg class="animate-spin h-6 w-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </div>
                <div class="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg class="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </div>
              </div>

              <!-- دکمه رفرش دایره‌ای -->
              <button
                type="button"
                @click="refreshCaptcha"
                class="w-10 h-10 rounded-full border border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:text-white hover:border-transparent transition flex items-center justify-center text-[var(--color-text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="isLoading"
                aria-label="تازه‌سازی کپچا"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>

              <!-- ورودی کپچا -->
              <div class="flex-1 w-full relative group">
                <input
                  ref="captchaInput"
                  v-model="captcha.answer"
                  id="input-captcha"
                  type="text"
                  maxlength="6"
                  :placeholder="!captcha.answer ? 'کد تصویر' : ''"
                  :class="inputWrapperClass('captcha')"
                  :disabled="isLoading"
                  inputmode="text"
                  autocomplete="off"
                />
                <div class="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-primary)] transition-colors pointer-events-none">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <p v-if="fieldErrors.captcha" class="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {{ fieldErrors.captcha }}
                </p>
              </div>
            </div>

            <!-- دکمه ارسال -->
            <div class="flex items-center justify-end gap-4">
              <button
                type="submit"
                :disabled="isLoading"
                class="btn btn-primary px-10 py-3.5 text-lg shadow-lg hover:shadow-[var(--color-primary)]/40 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                <span v-if="isLoading" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                <span v-else>{{ t('contact.send') }}</span>
              </button>
            </div>

            <!-- هانی‌پات -->
            <input type="text" name="website" v-model="form.website" class="hidden" tabindex="-1" autocomplete="off" />
          </form>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const API_BASE = import.meta.env.VITE_API_BASE

// State فرم
const form = reactive({
  name: "",
  email: "",
  message: "",
  website: ""
})

// State وضعیت
const isLoading = ref(false)
const success = ref(false)
const errorMessages = ref([])
const fieldErrors = ref({})

// State کپچا
const captcha = reactive({ id: '', image: '', answer: '' })
const captchaInput = ref(null)

// State ولیدیشن ایمیل (null: پیش فرض, true: صحیح, false: غلط)
const emailValidationStatus = ref(null)

// Helper: کلاس استایل اینپوت (پشتیبانی از آیکون و پرشینگ لبل)
const inputWrapperClass = (field) => {
  return [
    'w-full px-10 py-3 rounded-xl bg-[var(--color-background)] border-token transition-all outline-none text-[var(--color-text)]',
    // وقتی فیلد پر است یا فوکوس دارد
    'placeholder-transparent peer',
    // حالت خطا
    fieldErrors.value[field] ? 'border-red-500 ring-1 ring-red-500' : 'focus:ring-2 focus:ring-[var(--color-primary)]'
  ]
}

// --- منطق Spotlight Effect ---
const handleMouseMove = (e) => {
  for (const card of document.getElementsByClassName("spotlight-card")) {
    const rect = card.getBoundingClientRect(),
      x = e.clientX - rect.left,
      y = e.clientY - rect.top;

    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  }
}

// --- منطق Email Validation ---
const validateEmail = (email) => {
  if (!email) {
    emailValidationStatus.value = null
    return
  }
  // یک Regex ساده اما قدرتمند برای چک ساختار ایمیل
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  emailValidationStatus.value = emailRegex.test(email)
}

// وچ کردن ایمیل
watch(() => form.email, (newVal) => {
  validateEmail(newVal)
})


// --- منطق کپچا ---
function normalizeCaptchaAnswer(v) {
  if (!v) return ''
  const map = {
    '\u06F0': '0', '\u06F1': '1', '\u06F2': '2', '\u06F3': '3', '\u06F4': '4',
    '\u06F5': '5', '\u06F6': '6', '\u06F7': '7', '\u06F8': '8', '\u06F9': '9',
    '\u0660': '0', '\u0661': '1', '\u0662': '2', '\u0663': '3', '\u0664': '4',
    '\u0665': '5', '\u0666': '6', '\u0667': '7', '\u0668': '8', '\u0669': '9'
  };
  const s = String(v).trim().replace(/\s+/g, '')
  return s.replace(/[\u06F0-\u06F9\u0660-\u0669]/g, d => map[d] ?? d)
}

async function fetchCaptcha() {
  fieldErrors.value.captcha = ''
  try {
    const res = await fetch(`${API_BASE}/api/captcha/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept':'application/json' }
    })

    if (!res.ok) throw new Error('خطا در دریافت کپچا')

    const data = await res.json()
    const payload = data?.data ?? data

    captcha.id = payload.id
    captcha.image = payload.image_utf8 || payload.image
    captcha.answer = ''

    await nextTick()
    captchaInput.value?.focus()
  } catch (e) {
    console.error(e)
    fieldErrors.value.captcha = 'خطا در بارگذاری کپچا'
  }
}

function refreshCaptcha() {
  fetchCaptcha()
}

function resetForm() {
  success.value = false
}

const submitForm = async () => {
  isLoading.value = true
  errorMessages.value = []
  fieldErrors.value = {}
  success.value = false

  try {
    const payload = {
      name: form.name,
      email: form.email,
      message: form.message,
      website: form.website,
      captcha_id: captcha.id,
      captcha_answer: normalizeCaptchaAnswer(captcha.answer)
    }

    const res = await fetch(`${API_BASE}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept':'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const data = await res.json()

      if (data.errors) {
        if (typeof data.errors === 'object') {
          Object.keys(data.errors).forEach(key => {
            const fieldName = key === 'captcha_answer' ? 'captcha' : key
            fieldErrors.value[fieldName] = Array.isArray(data.errors[key]) ? data.errors[key][0] : data.errors[key]
          })
        }
        if (Array.isArray(data.errors)) {
          errorMessages.value = data.errors
        }
      } else if (data.message) {
        errorMessages.value = [data.message]
      }

      if (fieldErrors.value.captcha || res.status === 422) {
        fetchCaptcha()
      }
      return
    }

    success.value = true

    form.name = ""
    form.email = ""
    form.message = ""
    emailValidationStatus.value = null

    fetchCaptcha()

  } catch (error) {
    errorMessages.value = ['خطایی در ارتباط با سرور رخ داد.']
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchCaptcha()
})
</script>

<style scoped>
/* --- افکت موفقیت --- */
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out forwards;
}

/* --- انیمیشن اسلاید خطا --- */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* --- Spotlight Effect --- */
.spotlight-card::before {
  background: radial-gradient(
    800px circle at var(--mouse-x) var(--mouse-y),
    rgba(var(--color-primary-rgb), 0.06),
    transparent 40%
  );
  z-index: 0;
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  opacity: 0;
  border-radius: inherit;
  transition: opacity 0.5s;
  pointer-events: none;
}
.spotlight-card:hover::before {
  opacity: 1;
}

/* --- انیمیشن آیکون ایمیل --- */
@keyframes scale-in {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.animate-scale-in {
  animation: scale-in 0.3s ease-out forwards;
}
</style>