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
    await store.markRead(n.id)
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
  <section class="surface p-4 md:p-6 rounded-xl border border-token shadow-sm text-right">
    <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
      <h1 class="text-xl md:text-2xl font-extrabold text-[var(--color-heading)] flex items-center gap-2">
        <Bell class="w-6 h-6 text-[var(--color-secondary)]" />
        اعلان‌ها
      </h1>

      <!-- اکشن‌های گروهی -->
      <div class="flex items-center gap-2">
        <button
          @click="markAllRead"
          class="tap-target inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-token surface-soft hover-surface-mute text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="store.unreadCount === 0 || store.loading"
        >
          <CheckCheck class="w-4 h-4" />
          علامت‌گذاری همه خوانده شد
        </button>

        <button
          @click="confirmRemoveAll"
          class="tap-target inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200/40 bg-red-50 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!store.items.length || store.loading"
        >
          <Trash2 class="w-4 h-4" />
          حذف همه
        </button>
      </div>
    </header>

    <!-- فیلترها + جستجو -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 items-end">
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
            placeholder="جستجو در عنوان/متن اعلان..."
          />
        </div>
      </div>
    </div>
    <!-- بدنه -->
    <div class="rounded-xl border border-token overflow-hidden">
      <div
        v-if="store.loading"
        class="flex items-center justify-center gap-2 py-8 text-[var(--color-text-secondary)]"
      >
        <Loader2 class="w-5 h-5 animate-spin" />
        در حال بارگذاری...
      </div>

      <div
        v-else-if="store.error"
        class="px-4 py-6 text-center text-sm text-red-500"
      >
        خطا در دریافت اعلان‌ها
      </div>

      <template v-else>
        <div
          v-if="filtered.length === 0"
          class="px-4 py-10 text-center text-sm text-[var(--color-text-secondary)]"
        >
          هیچ اعلان مطابقی یافت نشد.
        </div>

        <ul v-else class="divide-y divide-token">
          <li
            v-for="n in filtered"
            :key="n.id"
            class="px-4 py-3 surface hover-surface-mute transition"
            :class="{ 'cursor-pointer': n.url }"
            @click="open(n)"
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
                    {{ n.read_at ? 'خوانده شده' : 'نخوانده' }}
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
                    علامت‌گذاری به عنوان خوانده‌شده
                  </button>

                  <button
                    @click.stop="confirmRemove(n)"
                    class="icon-btn danger"
                    aria-label="حذف"
                    title="حذف"
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
                  class="w-3.5 h-3.5 text-green-500"
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
            در حال دریافت اعلان‌های بیشتر...
          </div>

          <div
            v-else-if="!store.nextPageUrl && store.items.length"
            class="text-xs text-[var(--color-text-secondary)]"
          >
            همه اعلان‌ها نمایش داده شد.
          </div>
        </div>
      </template>
    </div>
  </section>

  <!-- مدال حذف -->
  <transition name="fade">
    <div
      v-if="showConfirm"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      @click.self="cancelRemove"
    >
      <div class="surface border border-token rounded-xl shadow-xl w-[90%] max-w-sm p-6 text-center">
        <h2 class="text-lg font-bold text-[var(--color-heading)] mb-3">
          {{ confirmMode === 'all' ? 'حذف تمام اعلان‌ها' : 'حذف اعلان' }}
        </h2>

        <p class="text-sm text-[var(--color-text-secondary)] mb-6">
          {{
            confirmMode === 'all'
              ? 'آیا از حذف همهٔ اعلان‌ها مطمئن هستید؟'
              : 'آیا از حذف این اعلان مطمئن هستید؟'
          }}
        </p>

        <div class="flex justify-center gap-3">
          <button
            @click="doRemove"
            :disabled="removing"
            class="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold shadow focus:ring-2 focus:ring-red-500/30 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {{ removing ? 'در حال حذف...' : 'بله، حذف شود' }}
          </button>

          <button
            @click="cancelRemove"
            :disabled="removing"
            class="px-4 py-2 rounded-lg border border-token surface-soft hover-surface-mute text-sm font-semibold focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  </transition>
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

.select {
  padding: .5rem .75rem;
  border-radius: .75rem;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  outline: none;
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
  border-color: color-mix(in oklab, red 35%, var(--color-border));
  color: #ef4444;
}

.surface {
  background: var(--color-background);
}

.surface-soft {
  background: var(--color-background-soft);
}

.hover-surface-mute:hover {
  background: color-mix(in oklab, var(--color-background) 85%, black 8%);
}

.border-token {
  border-color: var(--color-border);
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