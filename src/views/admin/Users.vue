<template>
  <section class="space-y-5" dir="rtl">
    <!-- Standing call to action: the approval queue is why this screen exists -->
    <button
      v-if="pendingStore.count > 0 && filters.status !== 'pending'"
      type="button"
      class="flex w-full items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-right transition hover:bg-amber-500/15"
      @click="showPendingOnly"
    >
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
        <Clock class="h-5 w-5 text-amber-600" aria-hidden="true" />
      </span>
      <span class="flex-1">
        <strong class="block text-sm font-bold text-amber-700">
          {{ faNumber(pendingStore.count) }} حساب در انتظار تأیید شماست
        </strong>
        <span class="text-xs text-amber-600/80">
          تا زمانی که تأیید نکنید، این افراد نمی‌توانند وارد شوند.
        </span>
      </span>
      <ChevronLeft class="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
    </button>

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
        <BaseButton :loading="loading" @click="loadUsers">جست‌وجو</BaseButton>
      </div>
    </div>

    <p
      v-if="errorMessage"
      class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-600"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <div
      class="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm"
    >
      <div v-if="loading" class="p-12 text-center">
        <LoaderCircle
          class="mx-auto h-7 w-7 animate-spin text-[var(--color-text-secondary)]"
          aria-hidden="true"
        />
        <p class="mt-3 text-sm text-[var(--color-text-secondary)]">در حال دریافت کاربران...</p>
      </div>

      <div v-else-if="!users.length" class="p-12 text-center">
        <span
          class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-background-soft)]"
        >
          <component :is="emptyState.icon" class="h-7 w-7 text-[var(--color-text-secondary)]" aria-hidden="true" />
        </span>
        <p class="font-bold text-[var(--color-heading)]">{{ emptyState.title }}</p>
        <p class="mt-2 text-sm text-[var(--color-text-secondary)]">{{ emptyState.hint }}</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[860px] text-right text-sm">
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
              class="transition hover:bg-[var(--color-background-soft)]"
              :class="isPending(user) ? 'bg-amber-500/[0.04]' : ''"
            >
              <td class="p-4">
                <strong class="block text-[var(--color-heading)]">{{ user.name }}</strong>
                <span class="text-xs text-[var(--color-text-secondary)]" dir="ltr">
                  {{ user.email }}
                </span>
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
                <!-- Weight matches importance: approving is the job, role is upkeep -->
                <div class="flex items-center gap-2">
                  <BaseButton
                    v-if="!isApproved(user)"
                    size="sm"
                    variant="primary"
                    :loading="isBusy(user, 'approve')"
                    :disabled="savingId === user.id"
                    @click="ask(user, 'approve')"
                  >
                    تأیید و اجازهٔ ورود
                  </BaseButton>

                  <BaseButton
                    v-if="!isRejected(user) && user.role !== 'admin'"
                    size="sm"
                    variant="ghost"
                    class="!text-red-600"
                    :loading="isBusy(user, 'reject')"
                    :disabled="savingId === user.id"
                    @click="ask(user, 'reject')"
                  >
                    رد
                  </BaseButton>

                  <span class="mx-1 h-5 w-px bg-[var(--color-border)]" aria-hidden="true"></span>

                  <BaseButton
                    size="sm"
                    variant="ghost"
                    :loading="isBusy(user, 'role')"
                    :disabled="savingId === user.id"
                    @click="ask(user, 'role')"
                  >
                    {{ user.role === 'admin' ? 'تبدیل به کاربر' : 'ارتقا به مدیر' }}
                  </BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ConfirmDialog
      :open="Boolean(confirming)"
      :title="confirmCopy.title"
      :message="confirmCopy.message"
      :confirm-label="confirmCopy.confirmLabel"
      :variant="confirmCopy.variant"
      :loading="Boolean(savingId)"
      @confirm="runDecision"
      @cancel="confirming = null"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeft, Clock, LoaderCircle, Search, UserX, Users as UsersIcon } from 'lucide-vue-next'
import BaseButton from '@/components/UI/BaseButton.vue'
import ConfirmDialog from '@/components/UI/ConfirmDialog.vue'
import { useNotificationStore } from '@/stores/notification'
import { useAdminPendingUsersStore } from '@/stores/adminPendingUsers'
import {
  approveAdminUser,
  getAdminUsers,
  rejectAdminUser,
  updateAdminUserRole,
} from '@/plugins/api'

const route = useRoute()
const notifications = useNotificationStore()
const pendingStore = useAdminPendingUsersStore()

const users = ref([])
const loading = ref(false)
const savingId = ref(null)
// The row/action pair awaiting confirmation, e.g. { user, action: 'approve' }.
const confirming = ref(null)
const errorMessage = ref('')
// The "new user" notification links straight to ?status=pending.
const filters = reactive({ search: '', role: '', status: '' })

const faNumber = (value) => Number(value || 0).toLocaleString('fa-IR')
const formatDate = (value) =>
  value ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(value)) : '—'

const isApproved = (user) => Boolean(user.approved_at) && !user.rejected_at
const isRejected = (user) => Boolean(user.rejected_at)
const isPending = (user) => !user.approved_at && !user.rejected_at

const isBusy = (user, action) =>
  savingId.value === user.id && confirming.value?.action === action

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

const emptyState = computed(() => {
  if (filters.status === 'pending') {
    return {
      icon: UsersIcon,
      title: 'صف انتظار خالی است',
      hint: 'همهٔ درخواست‌ها بررسی شده‌اند. کاربر تازه که بیاید، اینجا و با اعلان خبردار می‌شوید.',
    }
  }
  return {
    icon: UserX,
    title: 'کاربری پیدا نشد',
    hint: 'صافی‌ها را تغییر دهید یا عبارت جست‌وجو را کوتاه‌تر کنید.',
  }
})

const confirmCopy = computed(() => {
  const target = confirming.value
  if (!target) return { title: '', message: '', confirmLabel: 'تأیید', variant: 'primary' }

  const name = target.user.name

  if (target.action === 'approve') {
    return {
      title: 'اجازهٔ ورود داده شود؟',
      message: `${name} پس از این می‌تواند وارد حساب خود شود و با ایمیل هم خبردار می‌شود.`,
      confirmLabel: 'بله، تأیید کن',
      variant: 'primary',
    }
  }

  if (target.action === 'reject') {
    return {
      title: 'درخواست رد شود؟',
      message: `${name} دیگر نمی‌تواند وارد شود و نشست‌های فعالش هم بسته می‌شود.`,
      confirmLabel: 'بله، رد کن',
      variant: 'danger',
    }
  }

  const toAdmin = target.user.role !== 'admin'
  return {
    title: toAdmin ? 'ارتقا به مدیر؟' : 'تبدیل به کاربر عادی؟',
    message: toAdmin
      ? `${name} به همهٔ بخش‌های پنل مدیریت دسترسی پیدا می‌کند.`
      : `دسترسی ${name} به پنل مدیریت گرفته می‌شود.`,
    confirmLabel: toAdmin ? 'بله، ارتقا بده' : 'بله، تغییر بده',
    variant: toAdmin ? 'primary' : 'danger',
  }
})

function cleanFilters() {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''))
}

async function loadUsers() {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await getAdminUsers(cleanFilters())
    users.value = response?.data?.data ?? response?.data ?? []
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || 'دریافت کاربران ناموفق بود.'
  } finally {
    loading.value = false
  }
}

function showPendingOnly() {
  filters.status = 'pending'
  loadUsers()
}

function ask(user, action) {
  confirming.value = { user, action }
}

async function runDecision() {
  const target = confirming.value
  if (!target) return

  const { user, action } = target
  savingId.value = user.id
  errorMessage.value = ''

  try {
    if (action === 'role') {
      const role = user.role === 'admin' ? 'user' : 'admin'
      await updateAdminUserRole(user.id, role)
      user.role = role
      notifications.setNotification({ message: 'نقش کاربر به‌روزرسانی شد.' })
    } else {
      const response =
        action === 'approve' ? await approveAdminUser(user.id) : await rejectAdminUser(user.id)

      // The response carries the refreshed row; adopt it so the table and the
      // server agree on the new state.
      Object.assign(user, response?.data ?? {})
      notifications.setNotification({
        message: response?.message || (action === 'approve' ? 'کاربر تأیید شد.' : 'درخواست رد شد.'),
      })
      await pendingStore.refresh()
    }

    confirming.value = null
  } catch (error) {
    confirming.value = null
    notifications.handleApiError(error)
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
  pendingStore.refresh()
})
</script>
