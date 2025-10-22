<template>
  <div class="min-h-screen flex items-center justify-center bg-[var(--color-background-soft)] px-4">
    <form
        class="w-full max-w-md bg-[var(--color-background)] shadow-xl rounded-2xl p-6 sm:p-8 border border-[var(--color-border)]"
        @submit.prevent="onSubmit"
        aria-describedby="register-errors"
    >
      <!-- سربرگ -->
      <div class="text-center mb-6">
        <h1 class="text-2xl sm:text-3xl font-extrabold text-[var(--color-heading)]">ثبت‌نام</h1>
        <p class="mt-2 text-sm text-[var(--color-text-secondary)]">حساب جدید بساز و شروع کن</p>
      </div>

      <!-- باکس خطا: اول errors، در غیر اینصورت message -->
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

      <!-- نام -->
      <label for="name" class="block text-sm mb-1 text-[var(--color-text-secondary)]">نام کامل</label>
      <input
          id="name" v-model="name" type="text"
          class="w-full p-3 rounded-xl border outline-none bg-[var(--color-background-mute)]
               border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]"
          :class="{'border-red-400 focus:ring-red-400': !!fieldErrors.name }"
          :aria-invalid="fieldErrors.name ? 'true' : 'false'"
          :disabled="loading" required
      />
      <p v-if="fieldErrors.name" class="mt-1 text-sm text-red-600">{{ fieldErrors.name }}</p>

      <!-- ایمیل -->
      <label for="email" class="block text-sm mt-4 mb-1 text-[var(--color-text-secondary)]">ایمیل</label>
      <input
          id="email" v-model="email" type="email" dir="ltr" autocomplete="username"
          class="w-full p-3 rounded-xl border outline-none bg-[var(--color-background-mute)]
               border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]"
          :class="{'border-red-400 focus:ring-red-400': !!fieldErrors.email }"
          :aria-invalid="fieldErrors.email ? 'true' : 'false'"
          :disabled="loading" required
      />
      <p v-if="fieldErrors.email" class="mt-1 text-sm text-red-600">{{ fieldErrors.email }}</p>

      <!-- رمز -->
      <label for="password" class="block text-sm mt-4 mb-1 text-[var(--color-text-secondary)]">رمز عبور</label>
      <input
          id="password" v-model="password" type="password" autocomplete="new-password"
          class="w-full p-3 rounded-xl border outline-none bg-[var(--color-background-mute)]
               border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]"
          :class="{'border-red-400 focus:ring-red-400': !!fieldErrors.password }"
          :aria-invalid="fieldErrors.password ? 'true' : 'false'"
          :disabled="loading" required
      />
      <p v-if="fieldErrors.password" class="mt-1 text-sm text-red-600">{{ fieldErrors.password }}</p>

      <!-- تکرار رمز -->
      <label for="confirm" class="block text-sm mt-4 mb-1 text-[var(--color-text-secondary)]">تکرار رمز عبور</label>
      <input
          id="confirm" v-model="confirmPassword" type="password" autocomplete="new-password"
          class="w-full p-3 rounded-xl border outline-none bg-[var(--color-background-mute)]
               border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]"
          :class="{'border-red-400 focus:ring-red-400': !!fieldErrors.confirm }"
          :aria-invalid="fieldErrors.confirm ? 'true' : 'false'"
          :disabled="loading" required
      />
      <p v-if="fieldErrors.confirm" class="mt-1 text-sm text-red-600">{{ fieldErrors.confirm }}</p>

      <!-- Honeypot -->
      <input v-model="hp" type="text" name="website" class="hidden" tabindex="-1" autocomplete="off" />

      <!-- کپچا -->
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
              type="button"
              @click="refreshCaptcha"
              class="px-3 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-background-mute)]
                   transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              :disabled="loading || refreshBusy"
              aria-label="تازه‌سازی کپچا"
              title="تازه‌سازی"
          >
            <span v-if="!refreshBusy">↻</span>
            <svg v-else class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"/>
              <path class="opacity-75" d="M4 12a8 8 0 0 1 8-8" stroke="currentColor"/>
            </svg>
            <span class="text-sm">تازه‌سازی</span>
          </button>
        </div>

        <input
            ref="captchaInput"
            v-model="captcha.answer"
            class="mt-3 w-full p-3 rounded-xl border outline-none bg-[var(--color-background-mute)]
                 border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]"
            :class="{'border-red-400 focus:ring-red-400': !!fieldErrors.captcha }"
            :aria-invalid="fieldErrors.captcha ? 'true' : 'false'"
            placeholder="کد داخل تصویر را وارد کنید"
            :disabled="loading"
            inputmode="latin"
            autocomplete="off"
            @keyup.enter="onSubmit"
        />
        <p v-if="fieldErrors.captcha" class="mt-1 text-sm text-red-600">{{ fieldErrors.captcha }}</p>
      </div>

      <!-- دکمه -->
      <button
          type="submit"
          class="w-full py-3 px-4 rounded-2xl font-semibold shadow-sm transition
               bg-green-600 hover:bg-green-700 text-white
               active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="loading || disabledSubmit"
          :aria-busy="loading ? 'true' : 'false'"
      >
        <span v-if="!loading">ثبت‌نام</span>
        <span v-else>در حال ثبت‌نام…</span>
      </button>

      <!-- لینک ورود -->
      <div class="text-center mt-6">
        <span class="text-[var(--color-text-secondary)] text-sm">قبلاً حساب داری؟</span>
        <RouterLink to="/login" class="text-[var(--color-primary)] font-medium hover:underline mr-1">
          ورود
        </RouterLink>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter, RouterLink } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8085'

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const loading = ref(false)
const hp = ref('') // Honeypot

// خطاها: اول errors (آرایه یا فیلدی)، اگر نبود message
const errorMessages = ref([])
const fieldErrors = ref({ name: '', email: '', password: '', confirm: '', captcha: '' })

// کپچا
const captcha = ref({ id: '', image: '', answer: '' })
const captchaInput = ref(null)
const refreshBusy = ref(false)

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

/** Helpers */
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

/** کپچا */
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
  fetchCaptcha().finally(() => setTimeout(() => (refreshBusy.value = false), 900))
}

/** پاک‌سازی خطاها */
function clearErrors() {
  errorMessages.value = []
  fieldErrors.value = { name: '', email: '', password: '', confirm: '', captcha: '' }
}

/** اعمال خطاها به UI: اول errors، اگر نبود message */
function applyErrors(parsed) {
  const msgs = Array.isArray(parsed?.messages) ? parsed.messages : []
  errorMessages.value = dedupStrings(msgs)

  const f = parsed?.fields || {}
  fieldErrors.value.name     = pickFirstString(f.name)
  fieldErrors.value.email    = pickFirstString(f.email)
  fieldErrors.value.password = pickFirstString(f.password)
  fieldErrors.value.confirm  = pickFirstString(f.password_confirmation || f.confirm)
  fieldErrors.value.captcha  =
      pickFirstString(f.captcha || f.captcha_id || f.captcha_answer) ||
      (errorMessages.value.find(m => /کپچا|captcha/i.test(m)) || '')
}

/** ولیدیشن مقدماتی فرانت */
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
    // فقط برای نمایش باکس بالا؛ هایلایت فیلدی قبلاً ست شد
    applyErrors({ messages: list })
    return false
  }
  return true
}

/** ارسال فرم */
async function onSubmit() {
  if (!validateBasics()) return
  loading.value = true
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
      await fetchCaptcha()        // ✅ بعد از هر خطا کپچا تازه شود
      await nextTick()
      captchaInput.value?.focus()
      return
    }

    const data = await res.json()
    clearErrors()
    // سازگار با successResponse بک‌اند: user/token زیر data
    auth.setAuth({ user: data.data.user, token: data.data.token })
    router.push({ name: 'goals' })
  } catch (e) {
    applyErrors({ messages: [e?.message || 'خطای نامشخص رخ داد.'] })
    await fetchCaptcha()
  } finally {
    loading.value = false
  }
}

/** پارس خطاهای بک: اگر errors بود همان‌ها، وگرنه message */
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
      // اگر نمی‌خواهی پیام‌های فیلدی در باکس بالا بیاید، خط زیر را بردار
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

onMounted(fetchCaptcha)

// پاک‌سازی خطاهای فیلدی با تایپ
watch(name, v => { if (v) fieldErrors.value.name = '' })
watch(email, v => { if (v) fieldErrors.value.email = '' })
watch(password, v => { if (v) fieldErrors.value.password = '' })
watch(confirmPassword, v => { if (v) fieldErrors.value.confirm = '' })
watch(() => captcha.value.answer, v => { if (v) fieldErrors.value.captcha = '' })
</script>
