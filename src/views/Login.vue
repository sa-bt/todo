<template>
  <div class="min-h-screen flex items-center justify-center bg-[var(--color-background-soft)] px-4">
    <form
        class="w-full max-w-md bg-[var(--color-background)] shadow-xl rounded-2xl p-6 sm:p-8 border border-[var(--color-border)]"
        @submit.prevent="onSubmit"
        aria-describedby="login-errors"
    >
      <!-- سربرگ -->
      <div class="text-center mb-6">
        <h1 class="text-2xl sm:text-3xl font-extrabold text-[var(--color-heading)]">ورود به سیستم</h1>
        <p class="mt-2 text-sm text-[var(--color-text-secondary)]">برای ادامه، وارد حساب خود شوید</p>
      </div>

      <!-- باکس خطای جامع: اول errors، اگر نبود message -->
      <div
          v-if="errorMessages.length"
          id="login-errors"
          role="alert"
          aria-live="polite"
          class="mb-4 p-3 rounded-xl bg-red-500/10 text-red-700 border border-red-500/30"
      >
        <ul class="list-disc mr-5 space-y-1">
          <li v-for="(msg, i) in errorMessages" :key="i">{{ msg }}</li>
        </ul>
      </div>

      <!-- ایمیل -->
      <label for="email" class="block text-sm mb-1 text-[var(--color-text-secondary)]">ایمیل یا نام کاربری</label>
      <input
          id="email" v-model="email" type="text" dir="ltr" autocomplete="username"
          class="w-full p-3 rounded-xl border outline-none bg-[var(--color-background-mute)]
               border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]"
          :class="{'border-red-400 focus:ring-red-400': !!fieldErrors.email }"
          :aria-invalid="fieldErrors.email ? 'true' : 'false'"
          :disabled="loading" required
      />
      <p v-if="fieldErrors.email" class="mt-1 text-sm text-red-600">{{ fieldErrors.email }}</p>

      <!-- پسورد -->
      <label for="password" class="block text-sm mt-4 mb-1 text-[var(--color-text-secondary)]">رمز عبور</label>
      <input
          id="password" v-model="password" type="password" autocomplete="current-password"
          class="w-full p-3 rounded-xl border outline-none bg-[var(--color-background-mute)]
               border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]"
          :class="{'border-red-400 focus:ring-red-400': !!fieldErrors.password }"
          :aria-invalid="fieldErrors.password ? 'true' : 'false'"
          :disabled="loading" required
      />
      <p v-if="fieldErrors.password" class="mt-1 text-sm text-red-600">{{ fieldErrors.password }}</p>

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
              <path class="opacity-75" d="M4 12a 8 8 0 0 1 8-8" stroke="currentColor"/>
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
               bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white
               active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="loading || !email || !password || !captcha.id || !captcha.answer"
          :aria-busy="loading ? 'true' : 'false'"
      >
        <span v-if="!loading">ورود</span>
        <span v-else>در حال ورود…</span>
      </button>

      <!-- لینک ثبت‌نام -->
      <div class="text-center mt-6">
        <span class="text-[var(--color-text-secondary)] text-sm">حساب کاربری نداری؟</span>
        <RouterLink to="/register" class="text-[var(--color-primary)] font-medium hover:underline mr-1">
          ثبت‌نام کن
        </RouterLink>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter, RouterLink } from 'vue-router'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const hp = ref('') // Honeypot

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8085'

/** خطاها */
const errorMessages = ref([]) // اول errors، اگر نبود message
const fieldErrors = ref({ email: '', password: '', captcha: '' })

/** کپچا */
const captcha = ref({ id: '', image: '', answer: '' })
const captchaInput = ref(null)
const refreshBusy = ref(false)

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
    const payload = data?.data ?? data // successResponse یا ساده
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
  fieldErrors.value = { email: '', password: '', captcha: '' }
}

/** اعمال خطاها به UI: اول errors (آرایه یا فیلدی)، اگر نبود message */
function applyErrors(parsed) {
  const msgs = Array.isArray(parsed?.messages) ? parsed.messages : []
  errorMessages.value = dedupStrings(msgs)

  const f = parsed?.fields || {}
  fieldErrors.value.email    = pickFirstString(f.email || f.username || f.user)
  fieldErrors.value.password = pickFirstString(f.password)
  fieldErrors.value.captcha  =
      pickFirstString(f.captcha || f.captcha_id || f.captcha_answer) ||
      (errorMessages.value.find(m => /کپچا|captcha/i.test(m)) || '')
}

/** ولیدیشن مقدماتی فرانت */
function validateBasics () {
  clearErrors()
  const list = []
  if (!email.value.trim())    list.push('ایمیل/نام کاربری را وارد کنید.')
  if (!password.value.trim()) list.push('رمز عبور را وارد کنید.')
  if (!captcha.value.id)      list.push('تصویر کد تأیید بارگذاری نشده است.')
  if (!captcha.value.answer.trim()) list.push('کد تأیید را وارد کنید.')
  if (hp.value) list.push('درخواست نامعتبر.')
  if (list.length) {
    applyErrors({
      messages: list,
      fields: {
        email:    !email.value.trim() ? ['ایمیل/نام کاربری الزامی است.'] : [],
        password: !password.value.trim() ? ['رمز عبور الزامی است.'] : [],
        captcha:  !captcha.value.answer.trim() ? ['کد تأیید الزامی است.'] : [],
      }
    })
    return false
  }
  return true
}

/** ارسال فرم */
async function onSubmit () {
  if (!validateBasics()) return
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'X-Requested-With':'XMLHttpRequest',
        'Accept':'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        email: email.value,
        password: password.value,
        website: hp.value, // honeypot
        captcha_id: captcha.value.id,
        captcha_answer: normalizeCaptchaAnswer(captcha.value.answer)
      })
    })

    if (!res.ok) {
      const parsed = await parseErrorResponse(res)
      applyErrors(parsed)
      // ✅ همیشه بعد از خطا کپچا را تازه کن
      await fetchCaptcha()
      await nextTick()
      captchaInput.value?.focus()
      return
    }

    const data = await res.json()
    clearErrors()
    auth.setAuth({ user: data.data.user, token: data.data.token })
    router.push({ name: 'goals' })
  } catch (e) {
    applyErrors({ messages: [e?.message || 'خطای نامشخص رخ داد.'] })
    await fetchCaptcha()
  } finally {
    loading.value = false
  }
}

/** پارس خطای بک: اگر errors بود همان‌ها، وگرنه message */
async function parseErrorResponse(res) {
  let messages = []
  let fields = {}
  const status = res?.status

  try {
    const data = await res.json()

    // 1) اگر errors آرایه باشد → همان‌ها را استفاده کن
    if (Array.isArray(data?.errors)) {
      messages.push(...data.errors.map(String))
    }
        // 2) اگر errors آبجکت فیلدی باشد → برای هایلایت ذخیره؛
    //    (اگر نمی‌خواهی در باکس بالا بیاید، این push را حذف کن)
    else if (data?.errors && typeof data.errors === 'object') {
      fields = data.errors
      messages.push(...Object.values(data.errors).flat().map(String))
    }

    // 3) message را فقط وقتی اضافه کن که از errors چیزی نیامده باشد
    if (!messages.length && typeof data?.message === 'string' && data.message.trim() && !isBareErrorString(data.message)) {
      messages.unshift(data.message.trim())
    }

    // 4) extras (error/detail/title) را هم فقط اگر هنوز پیام نداریم
    if (!messages.length) {
      [data?.error, data?.detail, data?.title].forEach(v => {
        if (typeof v === 'string' && v.trim() && !isBareErrorString(v)) {
          messages.push(v.trim())
        }
      })
    }

  } catch {
    // اگر JSON نبود (مثلاً HTML)، فقط اگر پیام دیگری نداریم
    try {
      const txt = await res.text()
      if (!messages.length && txt && txt.trim() && !isBareErrorString(txt)) {
        messages.push(txt.trim())
      }
    } catch {}
  }

  // fallback‌های وضعیتی
  if (status === 410 && !messages.some(m => /کپچا|captcha/i.test(m))) {
    messages.unshift('کپچا منقضی شده، لطفاً دوباره تلاش کنید.')
  }
  if (status === 401 && !messages.length) messages.push('اطلاعات ورود نادرست است.')
  if (status === 429 && !messages.length) messages.push('دفعات تلاش بیش از حد مجاز است. بعداً دوباره تلاش کنید.')

  messages = dedupStrings(messages)
  if (!messages.length) messages = ['در پردازش درخواست خطایی رخ داد.']

  return { messages, fields, status }
}

onMounted(fetchCaptcha)

// UX: با تایپ کاربر خطای همان فیلد پاک شود
watch(email,    v => { if (v) fieldErrors.value.email = '' })
watch(password, v => { if (v) fieldErrors.value.password = '' })
watch(() => captcha.value.answer, v => { if (v) fieldErrors.value.captcha = '' })
</script>
