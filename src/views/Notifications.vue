<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  CheckCheck, Trash2, Bell, Loader2, Search,
  CheckCircle2, Circle
} from 'lucide-vue-next'
import { useSystemNotificationsStore } from '@/stores/systemNotifications'

const store = useSystemNotificationsStore()
const router = useRouter()

// فیلترها و جستجو
const statusFilter = ref('all')
const typeFilter   = ref('all')
const q            = ref('')

// استخراج انواع
const allTypes = computed(() => {
  const set = new Set(store.items.map(n => n.type || 'generic'))
  return ['all', ...Array.from(set)]
})

// فیلتر کردن اعلان‌ها
const filtered = computed(() => {
  const query = (q.value || '').trim().toLowerCase()
  return store.items.filter(n => {
    const matchStatus =
      statusFilter.value === 'all' ||
      (statusFilter.value === 'unread' && !n.read_at) ||
      (statusFilter.value === 'read' && !!n.read_at)

    const t = (n.type || 'generic')
    const matchType = typeFilter.value === 'all' || t === typeFilter.value

    const text = `${n.title ?? ''} ${n.body ?? ''}`.toLowerCase()
    const matchQuery = !query || text.includes(query)

    return matchStatus && matchType && matchQuery
  })
})

// فرمت زمان
function formatTime(isoOrStr) {
  try {
    const d = new Date(isoOrStr)
    if (Number.isNaN(+d)) return ''
    return new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(d)
  } catch { return '' }
}

// اکشن‌ها
async function markAllRead() {
  await store.markAllRead()
}

async function markRead(n) {
  if (n.read_at) return
  await store.markRead(n.id)
}

function loadMore() {
  store.loadNextPage()
}

// مدال تأیید حذف
const showConfirm = ref(false)
const confirmMode = ref('single') // single | all
const pendingRemove = ref(null)

function confirmRemove(n) {
  confirmMode.value = 'single'
  pendingRemove.value = n
  showConfirm.value = true
}

function confirmRemoveAll() {
  confirmMode.value = 'all'
  showConfirm.value = true
}

async function doRemove() {
  if (confirmMode.value === 'all') {
    await store.destroyAll()
  } else if (pendingRemove.value) {
    await store.destroy(pendingRemove.value.id)
  }
  showConfirm.value = false
  pendingRemove.value = null
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
      target = urlObj.pathname + urlObj.search + urlObj.hash
    } catch {}
  }
  router.push(target)
}

onMounted(async () => {
  if (!store.items.length) await store.loadFirstPage()
  else store.refreshUnreadCount()
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
          class="tap-target inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-token surface-soft hover:surface-mute text-sm font-semibold"
          :disabled="store.unreadCount === 0"
        >
          <CheckCheck class="w-4 h-4" />
          علامت‌گذاری همه خوانده شد
        </button>
        <button
          @click="confirmRemoveAll"
          class="tap-target inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200/40 bg-red-50 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold"
          :disabled="!store.items.length"
        >
          <Trash2 class="w-4 h-4" />
          حذف همه
        </button>
      </div>
    </header>

    <!-- فیلترها + جستجو -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      <div class="flex items-center gap-2">
        <label class="text-sm font-semibold text-[var(--color-heading)]">وضعیت:</label>
        <select v-model="statusFilter" class="select">
          <option value="all">همه</option>
          <option value="unread">نخوانده</option>
          <option value="read">خوانده</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <label class="text-sm font-semibold text-[var(--color-heading)]">نوع:</label>
        <select v-model="typeFilter" class="select">
          <option v-for="t in allTypes" :key="t" :value="t">
            {{ t === 'all' ? 'همه' : t }}
          </option>
        </select>
      </div>

      <div class="relative">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
        <input
          v-model="q"
          type="text"
          class="input pr-3 pl-9"
          placeholder="جستجو در عنوان/متن اعلان..."
        />
      </div>
    </div>

    <!-- بدنه -->
    <div class="rounded-xl border border-token overflow-hidden">
      <div v-if="store.loading" class="flex items-center justify-center gap-2 py-8 text-[var(--color-text-secondary)]">
        <Loader2 class="w-5 h-5 animate-spin" />
        در حال بارگذاری...
      </div>

      <div v-else-if="store.error" class="px-4 py-6 text-center text-sm text-red-500">
        خطا در دریافت اعلان‌ها
      </div>

      <template v-else>
        <div v-if="filtered.length === 0" class="px-4 py-10 text-center text-sm text-[var(--color-text-secondary)]">
          هیچ اعلان مطابقی یافت نشد.
        </div>

        <ul v-else class="divide-y divide-token">
          <li v-for="n in filtered" :key="n.id" class="px-4 py-3 surface hover:surface-mute transition">
            <div class="flex items-start gap-3">
              <img
                :src="n.icon || '/icons/notification.png'"
                alt=""
                class="w-8 h-8 mt-0.5 rounded border border-token object-cover"
              />

              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <h3 class="font-bold text-[var(--color-heading)] truncate">{{ n.title || 'اعلان' }}</h3>
                  <span class="text-[10px] text-[var(--color-text-secondary)] whitespace-nowrap">
                    {{ formatTime(n.time || n.created_at) }}
                  </span>
                </div>

                <p v-if="n.body" class="text-sm text-[var(--color-text)]/90 mt-1 leading-6">
                  {{ n.body }}
                </p>

                <div class="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <span class="chip chip-primary">
                    {{ n.type || 'generic' }}
                  </span>
                  <span class="chip" :class="n.read_at ? 'chip-muted' : 'chip-accent'">
                    {{ n.read_at ? 'خوانده شده' : 'نخوانده' }}
                  </span>
                </div>

                <div class="mt-3 flex items-center gap-2 justify-end">
                  <button
                    v-if="!n.read_at"
                    @click="markRead(n)"
                    class="btn-ghost-primary inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 class="w-4 h-4" />
                    خواندن
                  </button>

                  <button
                    @click="confirmRemove(n)"
                    class="icon-btn danger"
                    aria-label="حذف"
                    title="حذف"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div class="mt-1">
                <Circle v-if="!n.read_at" class="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <CheckCircle2 v-else class="w-3.5 h-3.5 text-green-500" />
              </div>
            </div>
          </li>
        </ul>

        <div v-if="store.nextPageUrl" class="p-3 text-center">
          <button
            @click="loadMore"
            class="tap-target px-4 py-2 rounded-lg border border-token surface-soft hover:surface-mute text-sm font-semibold"
          >
            نمایش بیشتر
          </button>
        </div>
      </template>
    </div>
  </section>

  <!-- مدال حذف -->
  <transition name="fade">
    <div
      v-if="showConfirm"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div class="surface border border-token rounded-xl shadow-xl w-[90%] max-w-sm p-6 text-center">
        <h2 class="text-lg font-bold text-[var(--color-heading)] mb-3">
          {{ confirmMode === 'all' ? 'حذف تمام اعلان‌ها' : 'حذف اعلان' }}
        </h2>
        <p class="text-sm text-[var(--color-text-secondary)] mb-6">
          {{ confirmMode === 'all'
              ? 'آیا از حذف همهٔ اعلان‌ها مطمئن هستید؟'
              : 'آیا از حذف این اعلان مطمئن هستید؟'
          }}
        </p>
        <div class="flex justify-center gap-3">
          <button
            @click="doRemove"
            class="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold shadow focus:ring-2 focus:ring-red-500/30 focus:outline-none"
          >
            بله، حذف شود
          </button>
          <button
            @click="cancelRemove"
            class="px-4 py-2 rounded-lg border border-token surface-soft hover:surface-mute text-sm font-semibold focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:outline-none"
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
  display: inline-flex; align-items: center; gap: .375rem;
  padding: .25rem .5rem; border-radius: 999px; border: 1px solid var(--color-border);
  background: var(--color-background-soft); color: var(--color-text);
}
.chip-primary {
  border-color: color-mix(in oklab, var(--color-primary) 35%, var(--color-border));
  color: var(--color-primary);
  background: color-mix(in oklab, var(--color-primary) 10%, transparent);
}
.chip-accent {
  border-color: color-mix(in oklab, var(--color-secondary) 35%, var(--color-border));
  color: var(--color-secondary);
  background: color-mix(in oklab, var(--color-secondary) 10%, transparent);
}
.chip-muted { opacity: .75; }

.btn-ghost {
  padding: .375rem .625rem; border-radius: .625rem; border: 1px solid var(--color-border);
  background: var(--color-background); color: var(--color-text);
}
.btn-ghost:hover { background: var(--color-background-soft); }
.btn-ghost-primary {
  padding: .375rem .625rem; border-radius: .625rem;
  border: 1px solid color-mix(in oklab, var(--color-primary) 40%, var(--color-border));
  background: color-mix(in oklab, var(--color-primary) 10%, var(--color-background));
  color: var(--color-primary);
}
.btn-ghost-primary:hover {
  background: color-mix(in oklab, var(--color-primary) 15%, var(--color-background));
}
.icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: .625rem;
  border: 1px solid var(--color-border);
  background: var(--color-background); color: var(--color-text);
}
.icon-btn:hover { background: var(--color-background-soft); }
.icon-btn.danger {
  border-color: color-mix(in oklab, red 35%, var(--color-border));
  color: #ef4444;
}
.surface { background: var(--color-background); }
.surface-soft { background: var(--color-background-soft); }
.surface-mute { background: color-mix(in oklab, var(--color-background) 85%, black 8%); }
.border-token { border-color: var(--color-border); }

[dir="rtl"] .truncate { direction: rtl; }
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
