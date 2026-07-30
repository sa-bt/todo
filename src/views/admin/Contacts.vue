<template>
  <section class="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]" dir="rtl">
    <div
      class="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm"
    >
      <div class="space-y-3 border-b border-[var(--color-border)] p-4">
        <input
          v-model="filters.search"
          type="search"
          class="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none"
          placeholder="جست‌وجوی پیام..."
          @keyup.enter="loadContacts"
        />
        <div class="flex gap-2">
          <select
            v-model="filters.status"
            class="min-h-10 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm"
            @change="loadContacts"
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="new">جدید</option>
            <option value="reviewing">در حال بررسی</option>
            <option value="answered">پاسخ‌داده‌شده</option>
            <option value="archived">بایگانی</option>
          </select>
          <button
            type="button"
            class="rounded-xl bg-[var(--color-primary)] px-4 text-sm font-bold text-white"
            @click="loadContacts"
          >
            اعمال
          </button>
        </div>
      </div>
      <p v-if="loading" class="p-10 text-center text-sm text-[var(--color-text-secondary)]">
        در حال دریافت پیام‌ها...
      </p>
      <p
        v-else-if="!contacts.length"
        class="p-10 text-center text-sm text-[var(--color-text-secondary)]"
      >
        پیامی پیدا نشد.
      </p>
      <button
        v-for="contact in contacts"
        v-else
        :key="contact.id"
        type="button"
        class="block w-full border-b border-[var(--color-border)] p-4 text-right transition last:border-0 hover:bg-[var(--color-background-soft)]"
        :class="selected?.id === contact.id ? 'bg-[var(--color-background-soft)]' : ''"
        @click="selectContact(contact)"
      >
        <div class="flex items-center justify-between gap-3">
          <strong class="truncate text-sm text-[var(--color-heading)]">{{ contact.name }}</strong
          ><span
            class="rounded-full px-2 py-1 text-[0.65rem] font-bold"
            :class="statusClass(contact.status)"
            >{{ statusLabel(contact.status) }}</span
          >
        </div>
        <p class="mt-2 line-clamp-2 text-xs leading-6 text-[var(--color-text-secondary)]">
          {{ contact.message }}
        </p>
      </button>
    </div>

    <div
      class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-sm"
    >
      <div
        v-if="!selected"
        class="grid min-h-80 place-items-center text-center text-sm text-[var(--color-text-secondary)]"
      >
        برای مشاهده و رسیدگی، یک پیام را انتخاب کنید.
      </div>
      <div v-else class="space-y-5">
        <div class="border-b border-[var(--color-border)] pb-4">
          <h2 class="text-lg font-black text-[var(--color-heading)]">{{ selected.name }}</h2>
          <a
            :href="`mailto:${selected.email}`"
            class="mt-1 inline-block text-sm text-[var(--color-primary)]"
            dir="ltr"
            >{{ selected.email }}</a
          >
        </div>
        <p
          class="whitespace-pre-wrap rounded-xl bg-[var(--color-background-soft)] p-4 text-sm leading-8 text-[var(--color-text)]"
        >
          {{ selected.message }}
        </p>
        <label class="block space-y-2"
          ><span class="text-sm font-bold">وضعیت رسیدگی</span
          ><select
            v-model="edit.status"
            class="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3"
          >
            <option value="new">جدید</option>
            <option value="reviewing">در حال بررسی</option>
            <option value="answered">پاسخ‌داده‌شده</option>
            <option value="archived">بایگانی</option>
          </select></label
        >
        <label class="block space-y-2"
          ><span class="text-sm font-bold">یادداشت داخلی</span
          ><textarea
            v-model="edit.admin_note"
            rows="6"
            class="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none"
            placeholder="این یادداشت فقط برای مدیران است."
          />
        </label>
        <p v-if="errorMessage" class="text-sm text-rose-600">{{ errorMessage }}</p>
        <button
          type="button"
          class="min-h-11 w-full rounded-xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white disabled:opacity-60"
          :disabled="saving"
          @click="saveContact"
        >
          ذخیره وضعیت پیام
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getAdminContacts, updateAdminContact } from '@/plugins/api'

const contacts = ref([])
const selected = ref(null)
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const filters = reactive({ search: '', status: '' })
const edit = reactive({ status: 'new', admin_note: '' })
const statusLabel = (value) =>
  ({ new: 'جدید', reviewing: 'در حال بررسی', answered: 'پاسخ‌داده‌شده', archived: 'بایگانی' })[
    value
  ] || value
const statusClass = (value) =>
  ({
    new: 'bg-blue-500/10 text-blue-600',
    reviewing: 'bg-amber-500/10 text-amber-600',
    answered: 'bg-emerald-500/10 text-emerald-600',
    archived: 'bg-slate-500/10 text-[var(--color-text-secondary)]',
  })[value]

function selectContact(contact) {
  selected.value = contact
  edit.status = contact.status || 'new'
  edit.admin_note = contact.admin_note || ''
  errorMessage.value = ''
}

async function loadContacts() {
  loading.value = true
  try {
    const response = await getAdminContacts(filters)
    contacts.value = response?.data?.data ?? response?.data ?? []
  } finally {
    loading.value = false
  }
}

async function saveContact() {
  saving.value = true
  errorMessage.value = ''
  try {
    const response = await updateAdminContact(selected.value.id, edit)
    const updated = response?.data
    Object.assign(selected.value, updated)
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || 'ذخیره وضعیت پیام ناموفق بود.'
  } finally {
    saving.value = false
  }
}

onMounted(loadContacts)
</script>
