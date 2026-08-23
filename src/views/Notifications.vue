<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  CheckCheck,
  Trash2,
  Bell,
  Loader2,
  Search,
  CheckCircle2,
  Circle,
} from 'lucide-vue-next'
import { useSystemNotificationsStore } from '@/stores/systemNotifications'
import BaseSelect from '@/components/UI/BaseSelect.vue'
import PageHeader from '@/components/UI/PageHeader.vue'
import EmptyState from '@/components/UI/EmptyState.vue'
import LoadingState from '@/components/UI/LoadingState.vue'
import ConfirmDialog from '@/components/UI/ConfirmDialog.vue'
const store = useSystemNotificationsStore()
const router = useRouter()

// فیلترها و جستجو
const statusFilter = ref('all')
const q = ref('')

const statusOptions = [
  { value: 'all', label: 'همه اعلان‌ها' },
  { value: 'unread', label: 'نخوانده‌ها' },
  { value: 'read', label: 'خوانده‌شده‌ها' },
]

// Infinite Scroll
const loadMoreTrigger = ref(null)
let observer = null

const canLoadMore = computed(() => {
  return !!store.nextPageUrl && !store.loading && !store.loadingMore
})

// فیلتر کردن اعلان‌ها
const filtered = computed(() => {
  const query = (q.value || '').trim().toLowerCase()

  return store.items.filter((n) => {
    const matchStatus =
      statusFilter.value === 'all' ||
      (statusFilter.value === 'unread' && !n.read_at) ||
      (statusFilter.value === 'read' && !!n.read_at)

    const text = `${n.title ?? ''} ${n.body ?? ''}`.toLowerCase()
    const matchQuery = !query || text.includes(query)

    return matchStatus && matchQuery
  })
})

// فرمت زمان
function formatTime(isoOrStr) {
  if (!isoOrStr) return ''

  try {
    const d = new Date(isoOrStr)

    if (Number.isNaN(d.getTime())) return ''

    return new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(d)
  } catch {
    return ''
  }
}

// اکشن‌ها
async function markAllRead() {
  await store.markAllRead()
}

async function markRead(n) {
  if (n.read_at) return
  await store.markRead(n.id)
}

async function readAndOpen(n) {
  if (!n.read_at) {
    // باز کردن اعلان خودش یعنی خواندنش؛ پیام جداگانه لازم ندارد.
    await store.markRead(n.id, { silent: true })
  }

  open(n)
}

// مدال تأیید حذف
const showConfirm = ref(false)
const confirmMode = ref('single') // single | all
const pendingRemove = ref(null)
const removing = ref(false)

function confirmRemove(n) {
  confirmMode.value = 'single'
  pendingRemove.value = n
  showConfirm.value = true
}

function confirmRemoveAll() {
  confirmMode.value = 'all'
  pendingRemove.value = null
  showConfirm.value = true
}

async function doRemove() {
  if (removing.value) return

  removing.value = true

  try {
    if (confirmMode.value === 'all') {
      await store.destroyAll()
    } else if (pendingRemove.value) {
      await store.destroy(pendingRemove.value.id)
    }

    showConfirm.value = false
    pendingRemove.value = null
  } finally {
    removing.value = false
  }
}

function cancelRemove() {
  showConfirm.value = false
  pendingRemove.value = null
}

function open(n) {
  if (!n.url) return

  let target = n.url

  if (/^https?:\/\//.test(target)) {
    try {
      const urlObj = new URL(target)

      if (urlObj.origin === window.location.origin) {
        target = urlObj.pathname + urlObj.search + urlObj.hash
        router.push(target)
      } else {
        window.open(target, '_blank', 'noopener,noreferrer')
      }

      return
    } catch {
      return
    }
  }

  router.push(target)
}

async function handleIntersect(entries) {
  const entry = entries[0]

  if (!entry?.isIntersecting) return
  if (!canLoadMore.value) return

  await store.loadNextPage()
}

function setupInfiniteScroll() {
  if (!loadMoreTrigger.value) return

  observer = new IntersectionObserver(handleIntersect, {
    root: null,
    rootMargin: '200px',
    threshold: 0,
  })

  observer.observe(loadMoreTrigger.value)
}

onMounted(async () => {
  if (!store.items.length) {
    await store.loadFirstPage()
  } else {
    await store.refreshUnreadCount()
  }

  await nextTick()
  setupInfiniteScroll()
})

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<template>
  <section class="page text-right">
    <PageHeader title="اعلان‌ها" :icon="Bell">
      <template #actions>
        <!-- اکشن‌های گروهی -->
        <button
          type="button"
          @click="markAllRead"
          class="tap-target inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-token surface-soft hover-surface-mute text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="store.unreadCount === 0 || store.loading"
        >
          <CheckCheck class="w-4 h-4" aria-hidden="true" />
          خواندن همه
        </button>

        <button
          type="button"
          @click="confirmRemoveAll"
          class="tap-target inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-token surface-soft text-sm font-semibold text-[var(--color-danger)] hover-surface-mute disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!store.items.length || store.loading"
        >
          <Trash2 class="w-4 h-4" aria-hidden="true" />
          حذف همه
        </button>
      </template>
    </PageHeader>

    <!-- فیلترها + جستجو -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
      <BaseSelect
        v-model="statusFilter"
        name="notification-status-filter"
        label="وضعیت"
        :options="statusOptions"
        placeholder="انتخاب وضعیت"
        align="right"
        size="md"
      />

      <div class="space-y-2">
        <label class="block text-sm font-bold text-[var(--color-heading)]">
          جستجو
        </label>

        <div class="relative">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />

          <input
            v-model="q"
            type="text"
            class="input h-[42px] pr-3 pl-9"
            placeholder="جستجو در عنوان یا متن اعلان"
          />
        </div>
      </div>
    </div>
    <!-- بدنه -->
    <LoadingState v-if="store.loading" title="در حال بارگذاری اعلان‌ها…" />

    <EmptyState
      v-else-if="store.error"
      variant="error"
      title="دریافت اعلان‌ها ناموفق بود"
      description="اتصال اینترنت را بررسی کن و دوباره تلاش کن."
      action-label="تلاش دوباره"
      @action="store.loadFirstPage()"
    />

    <EmptyState
      v-else-if="filtered.length === 0"
      variant="filter"
      title="اعلانی با این فیلترها پیدا نشد"
      description="وضعیت و متن جستجو را بررسی کن."
    />

    <div v-else class="rounded-2xl border border-token overflow-hidden">
        <ul class="divide-y divide-token">
          <li
            v-for="n in filtered"
            :key="n.id"
            class="px-4 py-3 surface hover-surface-mute transition"
            :class="{ 'cursor-pointer': n.url }"
            @click="readAndOpen(n)"
          >
            <div class="flex items-start gap-3">
              <img
                :src="n.icon || '/icons/notification.png'"
                alt=""
                class="w-8 h-8 mt-0.5 rounded border border-token object-cover"
              />

              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <h3 class="font-bold text-[var(--color-heading)] truncate">
                    {{ n.title || 'اعلان' }}
                  </h3>

                  <span class="text-[10px] text-[var(--color-text-secondary)] whitespace-nowrap">
                    {{ formatTime(n.time || n.created_at) }}
                  </span>
                </div>

                <p
                  v-if="n.body"
                  class="text-sm text-[var(--color-text)]/90 mt-1 leading-6"
                >
                  {{ n.body }}
                </p>

                <div class="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <span
                    class="chip"
                    :class="n.read_at ? 'chip-muted' : 'chip-accent'"
                  >
                    {{ n.read_at ? 'خوانده‌شده' : 'نخوانده' }}
                  </span>
                </div>

                <div class="mt-3 flex items-center gap-2 justify-end">
                  <button
                    v-if="n.url"
                    @click.stop="readAndOpen(n)"
                    class="btn-ghost-primary inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 class="w-4 h-4" />
                    مشاهده اعلان
                  </button>

                  <button
                    v-else-if="!n.read_at"
                    @click.stop="markRead(n)"
                    class="btn-ghost-primary inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 class="w-4 h-4" />
                    خوانده شد
                  </button>

                  <button
                    @click.stop="confirmRemove(n)"
                    class="icon-btn danger tap-target"
                    aria-label="حذف اعلان"
                    title="حذف اعلان"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div class="mt-1">
                <Circle
                  v-if="!n.read_at"
                  class="w-3.5 h-3.5 text-[var(--color-primary)]"
                />

                <CheckCircle2
                  v-else
                  class="w-3.5 h-3.5"
                  :style="{ color: 'var(--color-success)' }"
                />
              </div>
            </div>
          </li>
        </ul>

        <!-- Infinite Scroll Trigger -->
        <div
          ref="loadMoreTrigger"
          class="min-h-10 p-3 text-center"
        >
          <div
            v-if="store.loadingMore"
            class="inline-flex items-center justify-center gap-2 text-sm text-[var(--color-text-secondary)]"
          >
            <Loader2 class="w-4 h-4 animate-spin" />
            در حال دریافت اعلان‌های بیشتر…
          </div>

          <div
            v-else-if="!store.nextPageUrl && store.items.length"
            class="text-xs text-[var(--color-text-secondary)]"
          >
            همه اعلان‌ها نمایش داده شدند.
          </div>
        </div>
    </div>
  </section>

  <!-- مدال حذف -->
  <ConfirmDialog
    :open="showConfirm"
    :title="confirmMode === 'all' ? 'حذف همه اعلان‌ها' : 'حذف اعلان'"
    :message="confirmMode === 'all'
      ? 'همه اعلان‌ها، از جمله اعلان‌های خوانده‌نشده، برای همیشه حذف می‌شوند. این کار قابل بازگشت نیست.'
      : 'این اعلان حذف شود؟ این کار قابل بازگشت نیست.'"
    :confirm-label="confirmMode === 'all' ? 'حذف همه اعلان‌ها' : 'حذف اعلان'"
    variant="danger"
    :loading="removing"
    @cancel="cancelRemove"
    @confirm="doRemove"
  />
</template>

<style scoped>
.input {
  width: 100%;
  padding: .625rem .75rem;
  border-radius: .75rem;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  outline: none;
  transition: .15s ease;
}

.input:focus {
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 25%, transparent);
  border-color: var(--color-primary);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: .375rem;
  padding: .25rem .5rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
  color: var(--color-text);
}

.chip-accent {
  border-color: color-mix(in oklab, var(--color-secondary) 35%, var(--color-border));
  color: var(--color-secondary);
  background: color-mix(in oklab, var(--color-secondary) 10%, transparent);
}

.chip-muted {
  opacity: .75;
}

.btn-ghost-primary {
  padding: .375rem .625rem;
  border-radius: .625rem;
  border: 1px solid color-mix(in oklab, var(--color-primary) 40%, var(--color-border));
  background: color-mix(in oklab, var(--color-primary) 10%, var(--color-background));
  color: var(--color-primary);
}

.btn-ghost-primary:hover {
  background: color-mix(in oklab, var(--color-primary) 15%, var(--color-background));
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: .625rem;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
}

.icon-btn:hover {
  background: var(--color-background-soft);
}

.icon-btn.danger {
  border-color: color-mix(in oklab, var(--color-danger) 35%, var(--color-border));
  color: var(--color-danger);
}

[dir="rtl"] .truncate {
  direction: rtl;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>