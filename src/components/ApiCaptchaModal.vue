<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
      <h3 class="text-lg font-semibold mb-4">تأیید انسان بودن</h3>

      <div class="flex items-center gap-4">
        <div class="border rounded p-2 bg-white">
          <!-- تصویر واضح SVG از سرور -->
          <img v-if="image" :src="image" alt="captcha" class="w-[260px] h-[76px] object-contain" />
          <div v-else class="w-[260px] h-[76px] grid place-items-center text-gray-500">در حال بارگذاری…</div>
        </div>

        <div class="flex flex-col gap-2">
          <button type="button" @click="refresh" class="px-3 py-1 border rounded">↻ تازه‌سازی</button>
        </div>
      </div>

      <input v-model="answer" class="mt-4 w-full p-2 border rounded" placeholder="کد را وارد کنید" @keyup.enter="submit" />

      <p v-if="error" class="text-red-600 mt-2">{{ error }}</p>
      <p v-if="success" class="text-green-600 mt-2">{{ success }}</p>

      <div class="mt-4 flex justify-end gap-3">
        <button class="px-4 py-2 rounded border" @click="$emit('close')">لغو</button>
        <button class="px-4 py-2 rounded bg-[var(--color-primary)] text-white" :disabled="loading || !id" @click="submit">
          <span v-if="!loading">تأیید</span><span v-else>در حال بررسی…</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  apiBase: { type: String, default: '/api' },
})
const emit = defineEmits(['close','verified'])

const id = ref('')
const image = ref('')
const answer = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

async function refresh() {
  error.value = ''; success.value = ''; answer.value = ''
  try {
    const res = await fetch(`${props.apiBase}/captcha/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })
    const data = await res.json()
    id.value = data.id
    image.value = data.image // data:image/svg+xml;base64,...
  } catch (e) {
    error.value = 'خطا در دریافت کپچا.'
    console.error(e)
  }
}

async function submit() {
  if (!id.value) { error.value = 'کپچا بارگیری نشده است.'; return }
  if (!answer.value.trim()) { error.value = 'کد را وارد کنید.'; return }
  loading.value = true
  error.value = ''; success.value = ''
  try {
    const res = await fetch(`${props.apiBase}/captcha/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: id.value, answer: answer.value.trim() })
    })
    const data = await res.json()
    if (res.ok && data.ok) {
      success.value = data.message || 'تأیید شد.'
      // اطلاع به والد برای ادامهٔ لاگین
      emit('verified', { id: id.value })
    } else {
      error.value = data.message || 'کد اشتباه است.'
      await refresh() // برای تلاش دوباره، تصویر جدید
    }
  } catch (e) {
    error.value = 'خطای شبکه.'
  } finally {
    loading.value = false
  }
}

watch(() => props.show, (v) => { if (v) refresh() })
</script>
