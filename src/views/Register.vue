<template>
  <div class="min-h-screen flex items-center justify-center bg-[var(--color-background-soft)] px-4" dir="rtl">
    <form
        class="w-full max-w-md bg-[var(--color-background)] shadow-xl rounded-2xl p-6 sm:p-8 border border-[var(--color-border)]"
        @submit.prevent="onSubmit"
        aria-describedby="register-errors"
        dir="rtl"
    >
      <div class="text-center mb-6">
        <h1 class="text-2xl sm:text-3xl font-extrabold text-[var(--color-heading)]">ثبت‌نام</h1>
        <p class="mt-2 text-sm text-[var(--color-text-secondary)]">حساب جدید بساز و شروع کن</p>
      </div>

      <div
          v-if="errorMessages.length"
          id="register-errors"
          role="alert"
          aria-live="polite"
          class="mb-4 p-3 rounded-xl bg-red-500/10 text-red-700 border border-red-500/30"
      >
        <ul class="list-disc mr-5 space-y-1">
          <li v-for="(msg, i) in errorMessages" :key="i">{{ msg }}</li>
        </ul>
      </div>

      <label for="name" class="block text-sm mb-1 text-[var(--color-text-secondary)]">نام کامل</label>
      <input
          id="name" v-model="name" type="text"
          class="w-full p-3 rounded-xl border outline-none bg-[var(--color-background-mute)] border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]"
          :class="{'border-red-400 focus:ring-red-400': !!fieldErrors.name }"
          :aria-invalid="fieldErrors.name ? 'true' : 'false'"
          :disabled="loading" required
      />
      <p v-if="fieldErrors.name" class="mt-1 text-sm text-red-600">{{ fieldErrors.name }}</p>

      <label for="email" class="block text-sm mt-4 mb-1 text-[var(--color-text-secondary)]">ایمیل</label>
      <input
          id="email" v-model="email" type="email" dir="ltr" autocomplete="username"
          class="w-full p-3 rounded-xl border outline-none bg-[var(--color-background-mute)] border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]"
          :class="{'border-red-400 focus:ring-red-400': !!fieldErrors.email }"
          :aria-invalid="fieldErrors.email ? 'true' : 'false'"
          :disabled="loading" required
      />
      <p v-if="fieldErrors.email" class="mt-1 text-sm text-red-600">{{ fieldErrors.email }}</p>

      <label for="password" class="block text-sm mt-4 mb-1 text-[var(--color-text-secondary)]">رمز عبور</label>
      <input
          id="password" v-model="password" type="password" autocomplete="new-password"
          class="w-full p-3 rounded-xl border outline-none bg-[var(--color-background-mute)] border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]"
          :class="{'border-red-400 focus:ring-red-400': !!fieldErrors.password }"
          :aria-invalid="fieldErrors.password ? 'true' : 'false'"
          :disabled="loading" required
      />
      <p v-if="fieldErrors.password" class="mt-1 text-sm text-red-600">{{ fieldErrors.password }}</p>
      
      <div class="mt-2 mb-4">
          <div class="flex items-center gap-2">
              <div class="h-2 w-full rounded-full transition-all duration-300" :class="strengthColor"></div>
              <span 
                  class="text-xs font-medium min-w-[40px] text-right" 
                  :class="{
                      'text-green-500': passwordStrength === 'strong', 'text-yellow-500': passwordStrength === 'medium', 
                      'text-red-500': passwordStrength === 'weak', 'text-[var(--color-text-secondary)]': passwordStrength === 'none'
                  }"
              >
                  <span v-if="passwordStrength === 'strong'">قوی</span>
                  <span v-else-if="passwordStrength === 'medium'">متوسط</span>
                  <span v-else-if="passwordStrength === 'weak'">ضعیف</span>
                  <span v-else>قوّت؟</span>
              </span>
          </div>
          
          <div v-if="password.length > 0" class="mt-3 text-sm grid grid-cols-1 sm:grid-cols-2 gap-2 text-[var(--color-text-secondary)]">
              <div class="flex items-center gap-1.5" :class="{'text-green-600 font-medium': strengthRules.minChars, 'text-red-600': !strengthRules.minChars}">
                  <Check v-if="strengthRules.minChars" class="w-4 h-4 shrink-0" /><X v-else class="w-4 h-4 shrink-0" />
                  حداقل ۱۰ کاراکتر
              </div>
              <div class="flex items-center gap-1.5" :class="{'text-green-600 font-medium': strengthRules.mixedCase, 'text-red-600': !strengthRules.mixedCase}">
                  <Check v-if="strengthRules.mixedCase" class="w-4 h-4 shrink-0" /><X v-else class="w-4 h-4 shrink-0" />
                  حروف کوچک و بزرگ
              </div>
              <div class="flex items-center gap-1.5" :class="{'text-green-600 font-medium': strengthRules.numbers, 'text-red-600': !strengthRules.numbers}">
                  <Check v-if="strengthRules.numbers" class="w-4 h-4 shrink-0" /><X v-else class="w-4 h-4 shrink-0" />
                  شامل عدد
              </div>
              <div class="flex items-center gap-1.5" :class="{'text-green-600 font-medium': strengthRules.symbols, 'text-red-600': !strengthRules.symbols}">
                  <Check v-if="strengthRules.symbols" class="w-4 h-4 shrink-0" /><X v-else class="w-4 h-4 shrink-0" />
                  شامل نماد
              </div>
          </div>
      </div>

      <label for="confirm" class="block text-sm mt-4 mb-1 text-[var(--color-text-secondary)]">تکرار رمز عبور</label>
      <input
          id="confirm" v-model="confirmPassword" type="password" autocomplete="new-password"
          class="w-full p-3 rounded-xl border outline-none bg-[var(--color-background-mute)] border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]"
          :class="{'border-red-400 focus:ring-red-400': !!fieldErrors.confirm }"
          :aria-invalid="fieldErrors.confirm ? 'true' : 'false'"
          :disabled="loading" required
      />
      <p v-if="fieldErrors.confirm" class="mt-1 text-sm text-red-600">{{ fieldErrors.confirm }}</p>

      <input v-model="hp" type="text" name="website" class="hidden" tabindex="-1" autocomplete="off" />

      <div class="mt-4 mb-5">
        <label class="block text-sm mb-2 text-[var(--color-text-secondary)]">کد تأیید</label>
        <div class="flex items-center gap-3">
          <div class=" rounded-2xl  p-0 overflow-hidden leading-none ">
            <img
                :key="captcha.id"
                v-if="captcha.image"
                :src="captcha.image"
                alt="captcha"
                class="block w-[200px] h-[70px] object-contain select-none"
                draggable="false"
            />
            <div v-else class="w-[240px] h-[72px] grid place-items-center text-gray-500">
              <div class="w-20 h-6 rounded animate-pulse bg-gray-200"></div>
            </div>
          </div>
          <button
              type="button" @click="refreshCaptcha"
              class="px-3 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-background-mute)] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              :disabled="loading || refreshBusy" aria-label="تازه‌سازی کپچا" title="تازه‌سازی"
          >
            <RefreshCw v-if="!refreshBusy" class="w-4 h-4" />
            <LoaderCircle v-else class="w-4 h-4 animate-spin" />
            <span class="text-sm">تازه‌سازی</span>
          </button>
        </div>

        <input
            ref="captchaInput" v-model="captcha.answer"
            class="mt-3 w-full p-3 rounded-xl border outline-none bg-[var(--color-background-mute)] border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]"
            :class="{'border-red-400 focus:ring-red-400': !!fieldErrors.captcha }"
            :aria-invalid="fieldErrors.captcha ? 'true' : 'false'"
            placeholder="کد داخل تصویر را وارد کنید" :disabled="loading" inputmode="latin" autocomplete="off" @keyup.enter="onSubmit"
        />
        <p v-if="fieldErrors.captcha" class="mt-1 text-sm text-red-600">{{ fieldErrors.captcha }}</p>
      </div>

      <button
          type="submit"
          class="w-full py-3 px-4 rounded-2xl font-semibold shadow-sm transition bg-green-600 hover:bg-green-700 text-white active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="loading || disabledSubmit"
          :aria-busy="loading ? 'true' : 'false'"
      >
        <span v-if="!loading">ثبت‌نام</span>
        <span v-else>در حال ثبت‌نام…</span>
      </button>

      <div class="text-center mt-6">
        <span class="text-[var(--color-text-secondary)] text-sm">قبلاً حساب داری؟</span>
        <RouterLink to="/login" class="text-[var(--color-primary)] font-medium hover:underline mr-1">
          ورود
        </RouterLink>
      </div>
    </form>
    
    <Teleport to="body">
        <div 
            v-if="isOtpModalOpen"
            class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
        >
            <div 
                class="w-full max-w-sm bg-[var(--color-background)] shadow-2xl rounded-2xl p-6 border border-[var(--color-border)] transform transition-transform duration-300 scale-100"
                role="dialog" aria-modal="true" aria-labelledby="otp-title" dir="rtl"
            >
                <form @submit.prevent="verifyOtp">
                    <div class="text-center mb-6">
                        <h2 id="otp-title" class="text-2xl font-extrabold text-[var(--color-heading)]">تأیید کد</h2>
                        <p class="mt-2 text-sm text-[var(--color-text-secondary)]">
                            کد ۶ رقمی ارسال‌شده به <span class="font-bold">{{ otpEmail }}</span> را وارد کنید.
                        </p>
                    </div>

                    <div v-if="otpSuccessMessage" class="mb-4 p-3 rounded-xl bg-green-500/10 text-green-700 border border-green-500/30">
                        <p class="font-medium flex items-center gap-2"><Check class="w-5 h-5"/> {{ otpSuccessMessage }}</p>
                    </div>
                    <div v-if="otpFieldError" class="mb-4 p-3 rounded-xl bg-red-500/10 text-red-700 border border-red-500/30">
                        <p class="font-medium flex items-center gap-2"><X class="w-5 h-5"/> {{ otpFieldError }}</p>
                    </div>

                    <label for="otp-code" class="sr-only">کد تأیید</label>
                    <input
                        id="otp-code" v-model="otpCode" type="text" dir="ltr"
                        class="w-full p-3 text-center text-xl tracking-[10px] rounded-xl border outline-none bg-[var(--color-background-mute)] border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]"
                        maxlength="6" inputmode="numeric" autocomplete="one-time-code" :disabled="otpLoading" required
                    />
                    
                    <button
                        type="submit"
                        class="w-full mt-6 py-3 px-4 rounded-2xl font-semibold shadow-sm transition bg-green-600 hover:bg-green-700 text-white active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        :disabled="otpLoading || otpCode.length !== 6"
                        :aria-busy="otpLoading ? 'true' : 'false'"
                    >
                        <LoaderCircle v-if="otpLoading" class="w-5 h-5 animate-spin" />
                        <span v-else>تأیید و ورود</span>
                    </button>

                    <div class="mt-4 flex items-center justify-between">
                        <button type="button" @click="resendCode" :disabled="otpLoading || resendTimer > 0"
                                class="text-[var(--color-primary)] font-medium text-sm hover:underline disabled:opacity-60 disabled:cursor-not-allowed">
                            <span v-if="resendTimer > 0">ارسال مجدد در ({{ formattedResendTimer }})</span>
                            <span v-else>ارسال مجدد کد</span>
                        </button>
                        
                        <button type="button" @click="isOtpModalOpen = false" :disabled="otpLoading"
                                class="text-[var(--color-text-secondary)] font-medium text-sm hover:underline">
                            بستن
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>

    <Teleport to="body">
        <div v-if="globalLoading"
            class="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[100] flex items-center justify-center transition-opacity duration-300"
            aria-label="در حال پردازش درخواست"
            aria-busy="true"
        >
            <LoaderCircle class="w-12 h-12 text-white animate-spin" />
        </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter, RouterLink } from 'vue-router'

import { LoaderCircle, RefreshCw, X, Check } from 'lucide-vue-next'

const auth = useAuthStore()
const router = useRouter()

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8085'

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const loading = ref(false)
const globalLoading = ref(false)
const hp = ref('')

const errorMessages = ref([])
const fieldErrors = ref({ name: '', email: '', password: '', confirm: '', captcha: '' })

const captcha = ref({ id: '', image: '', answer: '' })
const captchaInput = ref(null)
const refreshBusy = ref(false)

const isOtpModalOpen = ref(false)
const otpUserId = ref(null)
const otpEmail = ref('')
const otpCode = ref('')
const otpLoading = ref(false)
const otpFieldError = ref('')
const otpSuccessMessage = ref('')
const resendTimer = ref(0)


// --- Computed Properties ---

const formattedResendTimer = computed(() => {
    const totalSeconds = resendTimer.value
    if (totalSeconds <= 0) return ''

    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    const formatNumber = (num) => String(num).padStart(2, '0')

    return `${formatNumber(minutes)}:${formatNumber(seconds)} ثانیه`
})


const strengthRules = computed(() => {
  const p = password.value
  return {
    minChars: p.length >= 10,
    mixedCase: /[a-z]/.test(p) && /[A-Z]/.test(p),
    numbers: /\d/.test(p),
    symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
  }
})

const passwordStrength = computed(() => {
  const rules = strengthRules.value
  const score = Object.values(rules).filter(Boolean).length
  
  if (score === 4) return 'strong'
  if (score >= 2) return 'medium'
  if (password.value.length > 0) return 'weak'
  return 'none'
})

const strengthColor = computed(() => {
  switch (passwordStrength.value) {
    case 'strong': return 'bg-green-500'
    case 'medium': return 'bg-yellow-500'
    case 'weak': return 'bg-red-500'
    default: return 'bg-gray-300'
  }
})

const disabledSubmit = computed(() =>
    loading.value ||
    !name.value.trim() ||
    !email.value.trim() ||
    !password.value ||
    !confirmPassword.value ||
    password.value !== confirmPassword.value ||
    !captcha.value.id ||
    !captcha.value.answer
)


// --- Helpers ---

function isBareErrorString(s) { return /^\s*error\s*\.?\s*$/i.test(String(s || '')) }
function dedupStrings(arr) {
  return (arr || []).filter(Boolean).map(v => String(v).trim())
      .filter((v, i, a) => v && !isBareErrorString(v) && a.indexOf(v) === i)
}
function pickFirstString(v) {
  if (!v) return ''
  if (Array.isArray(v)) return String(v[0] ?? '').trim()
  if (typeof v === 'string') return v.trim()
  return ''
}
function normalizeCaptchaAnswer(v) {
  if (!v) return ''
  const map = {'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9',
    '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'}
  const s = String(v).trim().replace(/\s+/g, '')
  return s.replace(/[۰-۹٠-٩]/g, d => map[d] ?? d)
}

async function parseErrorResponse(res) {
  let messages = []
  let fields = {}
  const status = res?.status

  try {
    const data = await res.json()

    if (Array.isArray(data?.errors)) {
      messages.push(...data.errors.map(String))
    } else if (data?.errors && typeof data.errors === 'object') {
      fields = data.errors
      messages.push(...Object.values(data.errors).flat().map(String))
    }

    if (!messages.length && typeof data?.message === 'string' && data.message.trim() && !isBareErrorString(data.message)) {
      messages.unshift(data.message.trim())
    }

    if (!messages.length) {
      [data?.error, data?.detail, data?.title].forEach(v => {
        if (typeof v === 'string' && v.trim() && !isBareErrorString(v)) messages.push(v.trim())
      })
    }
  } catch {
    try {
      const txt = await res.text()
      if (!messages.length && txt && txt.trim() && !isBareErrorString(txt)) messages.push(txt.trim())
    } catch {}
  }

  if (status === 410 && !messages.some(m => /کپچا|captcha/i.test(m))) {
    messages.unshift('کپچا منقضی شده، لطفاً دوباره تلاش کنید.')
  }
  if (status === 429 && !messages.length) {
    messages.push('دفعات تلاش بیش از حد مجاز است. بعداً دوباره تلاش کنید.')
  }

  messages = dedupStrings(messages)
  if (!messages.length) messages = ['در پردازش درخواست خطایی رخ داد.']

  return { messages, fields, status }
}


// --- Main Form Functions ---

async function fetchCaptcha() {
  fieldErrors.value.captcha = ''
  try {
    const res = await fetch(`${API_BASE}/api/captcha/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept':'application/json' },
      credentials: 'include'
    })
    if (!res.ok) {
      const parsed = await parseErrorResponse(res)
      applyErrors(parsed)
      return
    }
    const data = await res.json()
    const payload = data?.data ?? data
    captcha.value.id = payload.id
    captcha.value.image = payload.image_utf8 || payload.image
    captcha.value.answer = ''
    await nextTick()
    captchaInput.value?.focus()
  } catch {
    applyErrors({ messages: ['خطا در دریافت تصویر تأیید. دوباره تلاش کنید.'] })
  }
}

function refreshCaptcha() {
  if (refreshBusy.value) return
  refreshBusy.value = true
  fetchCaptcha().finally(() => {
    setTimeout(() => (refreshBusy.value = false), 500)
  })
}

function clearErrors() {
  errorMessages.value = []
  fieldErrors.value = { name: '', email: '', password: '', confirm: '', captcha: '' }
}

function applyErrors(parsed) {
  const msgs = Array.isArray(parsed?.messages) ? parsed.messages : []
  errorMessages.value = dedupStrings(msgs)

  const f = parsed?.fields || {}
  fieldErrors.value.name     = pickFirstString(f.name)
  fieldErrors.value.email    = pickFirstString(f.email)
  fieldErrors.value.password = pickFirstString(f.password)
  
  fieldErrors.value.confirm  =
      pickFirstString(f.confirm || f.password_confirmation || f.password) 
      
  fieldErrors.value.captcha  =
      pickFirstString(f.captcha || f.captcha_id || f.captcha_answer) ||
      (errorMessages.value.find(m => /کپچا|captcha/i.test(m)) || '')
}

function validateBasics () {
  clearErrors()
  const list = []
  if (!name.value.trim()) list.push('نام کامل را وارد کنید.')
  if (!email.value.trim()) list.push('ایمیل را وارد کنید.')
  if (!password.value.trim()) list.push('رمز عبور را وارد کنید.')
  if (!confirmPassword.value.trim()) list.push('تکرار رمز عبور را وارد کنید.')
  if (password.value && confirmPassword.value && password.value !== confirmPassword.value) {
    list.push('رمز عبور و تکرار آن مطابقت ندارند.')
    fieldErrors.value.confirm = 'تکرار رمز عبور مطابقت ندارد.'
  }
  if (!captcha.value.id) list.push('تصویر کد تأیید بارگذاری نشده است.')
  if (!captcha.value.answer.trim()) list.push('کد تأیید را وارد کنید.')
  if (hp.value) list.push('درخواست نامعتبر.')

  if (list.length) {
    applyErrors({ messages: list })
    return false
  }
  return true
}

async function onSubmit() {
  if (!validateBasics()) return
  loading.value = true
  globalLoading.value = true

  try {
    const res = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        name: name.value.trim(),
        email: email.value.trim(),
        password: password.value,
        password_confirmation: confirmPassword.value,
        website: hp.value,
        captcha_id: captcha.value.id,
        captcha_answer: normalizeCaptchaAnswer(captcha.value.answer)
      })
    })

    if (!res.ok) {
      const parsed = await parseErrorResponse(res)
      applyErrors(parsed)
      await fetchCaptcha()        
      await nextTick()
      captchaInput.value?.focus()
      return
    }

    const data = await res.json()
    clearErrors()
    
    otpUserId.value = data.data.user_id
    otpEmail.value = data.data.email
    otpCode.value = ''
    otpFieldError.value = ''
    otpSuccessMessage.value = data.message // 💡 پیام فارسی از بک‌اند
    isOtpModalOpen.value = true
    startResendTimer() 

  } catch (e) {
    applyErrors({ messages: [e?.message || 'خطای نامشخص رخ داد.'] })
    await fetchCaptcha()
  } finally {
    loading.value = false
    globalLoading.value = false
  }
}


// --- Modal OTP Functions ---

function startResendTimer() {
    resendTimer.value = 120
    const interval = setInterval(() => {
        if (resendTimer.value > 0) {
            resendTimer.value--
        } else {
            clearInterval(interval)
        }
    }, 1000)
}

async function verifyOtp() {
  otpFieldError.value = ''
  if (otpCode.value.length !== 6) {
    otpFieldError.value = 'کد تأیید باید ۶ رقم باشد.'
    return
  }
  
  otpLoading.value = true
  globalLoading.value = true 

  try {
    const res = await fetch(`${API_BASE}/api/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        user_id: otpUserId.value,
        otp: otpCode.value
      })
    })

    const data = await res.json()

    if (!res.ok) {
      otpFieldError.value = data.errors?.otp?.[0] || data.message || 'خطا در تأیید کد.'
      return
    }

    otpSuccessMessage.value = data.message
    auth.setAuth({ user: data.data.user, token: data.data.token })
    
    setTimeout(() => {
      router.push({ name: 'goals' }) 
    }, 1200)

  } catch (e) {
    otpFieldError.value = 'خطای ارتباطی رخ داد.'
  } finally {
    otpLoading.value = false
    if (!otpSuccessMessage.value) globalLoading.value = false 
  }
}

async function resendCode() {
  if (resendTimer.value > 0 || !otpUserId.value) return

  otpLoading.value = true
  globalLoading.value = true
  otpFieldError.value = ''
  otpSuccessMessage.value = ''

  try {
    const res = await fetch(`${API_BASE}/api/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ user_id: otpUserId.value })
    })

    const data = await res.json()

    if (res.ok) {
      otpSuccessMessage.value = data.message || 'کد جدید ارسال شد.'
      startResendTimer()
      otpCode.value = ''
    } else {
      otpFieldError.value = data.message || 'خطا در ارسال مجدد.'
    }
  } catch (e) {
    otpFieldError.value = 'خطای ارتباطی در ارسال مجدد.'
  } finally {
    otpLoading.value = false
    globalLoading.value = false
  }
}


onMounted(fetchCaptcha)

watch(name, v => { if (v) fieldErrors.value.name = '' })
watch(email, v => { if (v) fieldErrors.value.email = '' })
watch(password, v => { if (v) fieldErrors.value.password = '' })
watch(confirmPassword, v => { if (v) fieldErrors.value.confirm = '' })
watch(() => captcha.value.answer, v => { if (v) fieldErrors.value.captcha = '' })
</script>