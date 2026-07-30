<template>
  <section class="space-y-6" dir="rtl">
    <div
      class="flex flex-col gap-3 border-b border-[var(--color-border)] pb-5 lg:flex-row lg:items-end lg:justify-between"
    >
      <div>
        <p class="text-sm font-semibold text-[var(--color-primary)]">مرکز تولید محتوا</p>
        <h2 class="mt-2 text-2xl font-extrabold text-[var(--color-heading)]">محتواها</h2>
      </div>

      <button
        type="button"
        class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
        :disabled="saving"
        @click="saveContent"
      >
        <Plus class="h-4 w-4" aria-hidden="true" />
        {{ editingId ? 'ذخیره تغییرات' : 'ذخیره محتوا' }}
      </button>
    </div>

    <div
      v-if="successMessage"
      class="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-700"
      role="status"
    >
      <CircleCheck class="h-5 w-5 shrink-0" aria-hidden="true" />
      {{ successMessage }}
    </div>

    <div
      v-if="errorMessage"
      class="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-600"
      role="alert"
    >
      {{ errorMessage }}
    </div>

    <div class="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
      <form
        class="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-background-soft)] p-5"
        @submit.prevent="saveContent"
      >
        <div
          v-if="editingId"
          class="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3"
        >
          <span class="text-sm font-semibold text-[var(--color-heading)]">در حال ویرایش</span>
          <button
            type="button"
            class="text-sm font-semibold text-[var(--color-primary)]"
            @click="cancelEdit"
          >
            لغو
          </button>
        </div>

        <BaseInput
          v-model="form.title"
          name="content-title"
          label="عنوان"
          placeholder="عنوان محتوا"
          :disabled="saving"
        />

        <BaseTextArea
          v-model="form.body"
          name="content-body"
          label="متن"
          placeholder="متن خام محتوا"
          rows="8"
          :disabled="saving"
        />

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="space-y-2">
            <span class="block text-sm font-semibold text-[var(--color-heading)]">نوع</span>
            <select
              v-model="form.content_type"
              class="block min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_oklab,var(--color-primary)_30%,white)]"
              :disabled="saving"
            >
              <option value="note">یادداشت</option>
              <option value="quote">نقل‌قول</option>
              <option value="experience">تجربه</option>
            </select>
          </label>

          <label class="space-y-2">
            <span class="block text-sm font-semibold text-[var(--color-heading)]">وضعیت</span>
            <select
              v-model="form.status"
              class="block min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_oklab,var(--color-primary)_30%,white)]"
              :disabled="saving"
            >
              <option value="draft">پیش‌نویس</option>
              <option value="ready">آماده</option>
              <option value="archived">بایگانی</option>
            </select>
          </label>
        </div>

        <BaseInput
          v-model="form.source"
          name="content-source"
          label="منبع"
          placeholder="اختیاری"
          :disabled="saving"
        />
      </form>

      <div class="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]">
        <div class="flex items-center justify-between border-b border-[var(--color-border)] p-4">
          <h3 class="font-bold text-[var(--color-heading)]">فهرست محتوا</h3>
          <button
            type="button"
            class="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-heading)] transition hover:bg-[var(--color-background-mute)]"
            :disabled="loading"
            @click="loadContents"
          >
            <RefreshCw class="h-4 w-4" aria-hidden="true" />
            تازه‌سازی
          </button>
        </div>

        <div v-if="loading" class="p-8 text-center text-sm text-[var(--color-text-secondary)]">
          در حال بارگذاری...
        </div>

        <div
          v-else-if="contents.length === 0"
          class="p-8 text-center text-sm text-[var(--color-text-secondary)]"
        >
          هنوز محتوایی ثبت نشده است.
        </div>

        <ul v-else class="divide-y divide-[var(--color-border)]">
          <li v-for="content in contents" :key="content.id" class="p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <h4 class="font-bold text-[var(--color-heading)]">{{ content.title }}</h4>
                <p class="mt-2 line-clamp-2 text-sm leading-7 text-[var(--color-text-secondary)]">
                  {{ content.body || 'بدون متن' }}
                </p>
                <div class="mt-3 flex flex-wrap gap-2 text-xs">
                  <span
                    class="rounded-full bg-[var(--color-background-soft)] px-3 py-1 text-[var(--color-text-secondary)]"
                  >
                    {{ typeLabel(content.content_type) }}
                  </span>
                  <span
                    class="rounded-full bg-[var(--color-background-soft)] px-3 py-1 text-[var(--color-text-secondary)]"
                  >
                    {{ statusLabel(content.status) }}
                  </span>
                </div>
              </div>

              <div class="flex gap-2">
                <button
                  type="button"
                  class="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-heading)] transition hover:bg-[var(--color-background-mute)]"
                  @click="startEdit(content)"
                >
                  ویرایش
                </button>
                <button
                  type="button"
                  class="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-500/30 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-500/10"
                  @click="contentPendingDelete = content"
                >
                  حذف
                </button>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="contentPendingDelete"
        class="fixed inset-0 z-[80] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-content-title"
        @click.self="contentPendingDelete = null"
      >
        <div
          class="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-2xl"
        >
          <span class="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-600">
            <Trash2 class="h-6 w-6" aria-hidden="true" />
          </span>
          <h3 id="delete-content-title" class="mt-5 text-lg font-black text-[var(--color-heading)]">
            حذف محتوا؟
          </h3>
          <p class="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">
            محتوای «{{ contentPendingDelete.title }}» حذف می‌شود. این عملیات قابل بازگشت نیست.
          </p>
          <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="min-h-11 rounded-xl border border-[var(--color-border)] px-4 text-sm font-bold text-[var(--color-heading)]"
              :disabled="deleting"
              @click="contentPendingDelete = null"
            >
              انصراف
            </button>
            <button
              type="button"
              class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white disabled:opacity-60"
              :disabled="deleting"
              @click="removeContent"
            >
              <LoaderCircle v-if="deleting" class="h-4 w-4 animate-spin" aria-hidden="true" />
              حذف قطعی
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { CircleCheck, LoaderCircle, Plus, RefreshCw, Trash2 } from 'lucide-vue-next'
import BaseInput from '@/components/UI/BaseInput.vue'
import BaseTextArea from '@/components/UI/BaseTextArea.vue'
import {
  createAdminContent,
  deleteAdminContent,
  getAdminContents,
  updateAdminContent,
} from '@/plugins/api'

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const contents = ref([])
const editingId = ref(null)
const contentPendingDelete = ref(null)

const form = reactive({
  title: '',
  body: '',
  content_type: 'note',
  status: 'draft',
  source: '',
})

function resetForm() {
  editingId.value = null
  form.title = ''
  form.body = ''
  form.content_type = 'note'
  form.status = 'draft'
  form.source = ''
}

async function loadContents() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getAdminContents()
    contents.value = Array.isArray(response?.data) ? response.data : []
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || 'خطا در دریافت فهرست محتوا.'
  } finally {
    loading.value = false
  }
}

function startEdit(content) {
  editingId.value = content.id
  form.title = content.title || ''
  form.body = content.body || ''
  form.content_type = content.content_type || 'note'
  form.status = content.status || 'draft'
  form.source = content.source || ''
  errorMessage.value = ''
  successMessage.value = ''
}

function cancelEdit() {
  resetForm()
  errorMessage.value = ''
}

async function saveContent() {
  if (!form.title.trim()) {
    errorMessage.value = 'عنوان محتوا الزامی است.'
    return
  }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const payload = {
      title: form.title.trim(),
      body: form.body || null,
      content_type: form.content_type,
      status: form.status,
      source: form.source || null,
    }

    const wasEditing = Boolean(editingId.value)

    if (wasEditing) {
      await updateAdminContent(editingId.value, payload)
    } else {
      await createAdminContent(payload)
    }

    resetForm()
    await loadContents()
    successMessage.value = wasEditing ? 'تغییرات محتوا ذخیره شد.' : 'محتوای تازه با موفقیت ثبت شد.'
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || 'خطا در ذخیره محتوا.'
  } finally {
    saving.value = false
  }
}

async function removeContent() {
  const id = contentPendingDelete.value?.id

  if (!id) return

  deleting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await deleteAdminContent(id)
    contents.value = contents.value.filter((content) => content.id !== id)
    if (editingId.value === id) {
      resetForm()
    }
    contentPendingDelete.value = null
    successMessage.value = 'محتوا با موفقیت حذف شد.'
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || 'خطا در حذف محتوا.'
  } finally {
    deleting.value = false
  }
}

function onEscape(event) {
  if (event.key === 'Escape' && !deleting.value) {
    contentPendingDelete.value = null
  }
}

function typeLabel(value) {
  return (
    {
      note: 'یادداشت',
      quote: 'نقل‌قول',
      experience: 'تجربه',
    }[value] || value
  )
}

function statusLabel(value) {
  return (
    {
      draft: 'پیش‌نویس',
      ready: 'آماده',
      archived: 'بایگانی',
    }[value] || value
  )
}

onMounted(() => {
  window.addEventListener('keydown', onEscape)
  loadContents()
})

onUnmounted(() => window.removeEventListener('keydown', onEscape))
</script>
