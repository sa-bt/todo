<template>
  <section class="space-y-6" dir="rtl">
    <div class="flex flex-col gap-3 border-b border-[var(--color-border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
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
      v-if="errorMessage"
      class="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-medium text-red-600"
    >
      {{ errorMessage }}
    </div>

    <div class="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
      <form class="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-background-soft)] p-5" @submit.prevent="saveContent">
        <div v-if="editingId" class="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3">
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

        <div v-else-if="contents.length === 0" class="p-8 text-center text-sm text-[var(--color-text-secondary)]">
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
                  <span class="rounded-full bg-[var(--color-background-soft)] px-3 py-1 text-[var(--color-text-secondary)]">
                    {{ typeLabel(content.content_type) }}
                  </span>
                  <span class="rounded-full bg-[var(--color-background-soft)] px-3 py-1 text-[var(--color-text-secondary)]">
                    {{ statusLabel(content.status) }}
                  </span>
                </div>
              </div>

              <button
                type="button"
                class="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-500/30 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-500/10"
                @click="removeContent(content.id)"
              >
                حذف
              </button>
              <button
                type="button"
                class="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-heading)] transition hover:bg-[var(--color-background-mute)]"
                @click="startEdit(content)"
              >
                ویرایش
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Plus, RefreshCw } from 'lucide-vue-next'
import BaseInput from '@/components/UI/BaseInput.vue'
import BaseTextArea from '@/components/UI/BaseTextArea.vue'
import { createAdminContent, deleteAdminContent, getAdminContents, updateAdminContent } from '@/plugins/api'

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const contents = ref([])
const editingId = ref(null)

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

  try {
    const payload = {
      title: form.title.trim(),
      body: form.body || null,
      content_type: form.content_type,
      status: form.status,
      source: form.source || null,
    }

    if (editingId.value) {
      await updateAdminContent(editingId.value, payload)
    } else {
      await createAdminContent(payload)
    }

    resetForm()
    await loadContents()
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || 'خطا در ذخیره محتوا.'
  } finally {
    saving.value = false
  }
}

async function removeContent(id) {
  errorMessage.value = ''

  try {
    await deleteAdminContent(id)
    contents.value = contents.value.filter((content) => content.id !== id)
    if (editingId.value === id) {
      resetForm()
    }
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || 'خطا در حذف محتوا.'
  }
}

function typeLabel(value) {
  return {
    note: 'یادداشت',
    quote: 'نقل‌قول',
    experience: 'تجربه',
  }[value] || value
}

function statusLabel(value) {
  return {
    draft: 'پیش‌نویس',
    ready: 'آماده',
    archived: 'بایگانی',
  }[value] || value
}

onMounted(loadContents)
</script>
