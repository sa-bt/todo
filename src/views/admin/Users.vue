<template>
  <section class="space-y-5" dir="rtl">
    <div
      class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-sm"
    >
      <div class="grid gap-3 md:grid-cols-[1fr_12rem_12rem_auto]">
        <label
          class="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--color-border)] px-3"
        >
          <Search class="h-4 w-4 text-[var(--color-text-secondary)]" aria-hidden="true" />
          <input
            v-model="filters.search"
            type="search"
            class="min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder="نام یا ایمیل..."
            @keyup.enter="loadUsers"
          />
        </label>
        <select
          v-model="filters.role"
          class="min-h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm"
          @change="loadUsers"
        >
          <option value="">همه نقش‌ها</option>
          <option value="user">کاربر</option>
          <option value="admin">مدیر</option>
        </select>
        <select
          v-model="filters.status"
          class="min-h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm"
          @change="loadUsers"
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="pending">در انتظار تأیید</option>
          <option value="approved">تأییدشده</option>
          <option value="rejected">ردشده</option>
        </select>
        <button
          type="button"
          class="min-h-11 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-bold text-white"
          @click="loadUsers"
        >
          جست‌وجو
        </button>
      </div>
    </div>

    <p
      v-if="errorMessage"
      class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-600"
    >
      {{ errorMessage }}
    </p>

    <div
      class="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm"
    >
      <div v-if="loading" class="p-12 text-center text-sm text-[var(--color-text-secondary)]">
        در حال دریافت کاربران...
      </div>
      <div
        v-else-if="!users.length"
        class="p-12 text-center text-sm text-[var(--color-text-secondary)]"
      >
        کاربری مطابق صافی‌ها پیدا نشد.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[760px] text-right text-sm">
          <thead
            class="bg-[var(--color-background-soft)] text-xs text-[var(--color-text-secondary)]"
          >
            <tr>
              <th class="p-4">کاربر</th>
              <th class="p-4">وضعیت</th>
              <th class="p-4">نقش</th>
              <th class="p-4">اهداف</th>
              <th class="p-4">کارها</th>
              <th class="p-4">عضویت</th>
              <th class="p-4">عملیات</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--color-border)]">
            <tr
              v-for="user in users"
              :key="user.id"
              class="hover:bg-[var(--color-background-soft)]"
            >
              <td class="p-4">
                <strong class="block text-[var(--color-heading)]">{{ user.name }}</strong
                ><span class="text-xs text-[var(--color-text-secondary)]" dir="ltr">{{
                  user.email
                }}</span>
              </td>
              <td class="p-4">
                <span
                  class="whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold"
                  :class="statusBadge(user).class"
                  >{{ statusBadge(user).label }}</span
                >
              </td>
              <td class="p-4">
                <span
                  class="rounded-full px-3 py-1 text-xs font-bold"
                  :class="
                    user.role === 'admin'
                      ? 'bg-violet-500/10 text-violet-600'
                      : 'bg-slate-500/10 text-[var(--color-text-secondary)]'
                  "
                  >{{ user.role === 'admin' ? 'مدیر' : 'کاربر' }}</span
                >
              </td>
              <td class="p-4 tabular-nums">{{ faNumber(user.goals_count) }}</td>
              <td class="p-4 tabular-nums">{{ faNumber(user.tasks_count) }}</td>
              <td class="p-4 text-xs text-[var(--color-text-secondary)]">
                {{ formatDate(user.created_at) }}
              </td>
              <td class="p-4">
                <div class="flex flex-wrap gap-2">
                  <button
                    v-if="!isApproved(user)"
                    type="button"
                    class="min-h-9 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white disabled:opacity-60"
                    :disabled="savingId === user.id"
                    @click="decide(user, 'approve')"
                  >
                    تأیید و اجازهٔ ورود
                  </button>
                  <button
                    v-if="!isRejected(user) && user.role !== 'admin'"
                    type="button"
                    class="min-h-9 rounded-lg border border-rose-500/40 px-3 text-xs font-bold text-rose-600 disabled:opacity-60"
                    :disabled="savingId === user.id"
                    @click="decide(user, 'reject')"
                  >
                    رد
                  </button>
                  <button
                    type="button"
                    class="min-h-9 rounded-lg border border-[var(--color-border)] px-3 text-xs font-bold"
                    :disabled="savingId === user.id"
                    @click="toggleRole(user)"
                  >
                    {{ user.role === 'admin' ? 'تبدیل به کاربر' : 'ارتقا به مدیر' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Search } from 'lucide-vue-next'
import {
  approveAdminUser,
  getAdminUsers,
  rejectAdminUser,
  updateAdminUserRole,
} from '@/plugins/api'

const route = useRoute()
const users = ref([])
const loading = ref(false)
const savingId = ref(null)
const errorMessage = ref('')
// اعلان «کاربر جدید» مستقیم به ?status=pending می‌آید، پس صافی از نشانی خوانده می‌شود.
const filters = reactive({ search: '', role: '', status: '' })
const faNumber = (value) => Number(value || 0).toLocaleString('fa-IR')
const formatDate = (value) =>
  value ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(value)) : '—'

async function loadUsers() {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await getAdminUsers(filters)
    users.value = response?.data?.data ?? response?.data ?? []
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || 'دریافت کاربران ناموفق بود.'
  } finally {
    loading.value = false
  }
}

const isApproved = (user) => Boolean(user.approved_at) && !user.rejected_at
const isRejected = (user) => Boolean(user.rejected_at)

function statusBadge(user) {
  if (isRejected(user)) {
    return { label: 'ردشده', class: 'bg-rose-500/10 text-rose-600' }
  }
  if (isApproved(user)) {
    return { label: 'تأییدشده', class: 'bg-emerald-500/10 text-emerald-600' }
  }
  if (!user.email_verified_at) {
    return { label: 'ایمیل تأیید نشده', class: 'bg-slate-500/10 text-[var(--color-text-secondary)]' }
  }
  return { label: 'در انتظار تأیید', class: 'bg-amber-500/10 text-amber-600' }
}

async function decide(user, action) {
  const isApproving = action === 'approve'
  const confirmText = isApproving
    ? `به ${user.name} اجازهٔ ورود داده شود؟`
    : `درخواست ${user.name} رد شود؟ توکن‌های فعالش هم باطل می‌شود.`

  if (!window.confirm(confirmText)) return

  savingId.value = user.id
  errorMessage.value = ''
  try {
    const response = isApproving
      ? await approveAdminUser(user.id)
      : await rejectAdminUser(user.id)

    // پاسخ، ردیف تازه‌شده را برمی‌گرداند؛ همان را می‌نشانیم تا وضعیت جدول
    // با سرور یکی بماند.
    Object.assign(user, response?.data ?? {})
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.message ||
      (isApproving ? 'تأیید کاربر انجام نشد.' : 'رد کردن کاربر انجام نشد.')
  } finally {
    savingId.value = null
  }
}

async function toggleRole(user) {
  savingId.value = user.id
  errorMessage.value = ''
  try {
    const role = user.role === 'admin' ? 'user' : 'admin'
    await updateAdminUserRole(user.id, role)
    user.role = role
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || 'تغییر نقش کاربر انجام نشد.'
  } finally {
    savingId.value = null
  }
}

onMounted(() => {
  const status = route.query.status
  if (['pending', 'approved', 'rejected'].includes(status)) {
    filters.status = status
  }
  loadUsers()
})
</script>
