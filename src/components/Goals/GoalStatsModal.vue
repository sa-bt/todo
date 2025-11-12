<template>
  <Teleport to="body">
    <transition name="fade-scale">
      <div
          v-if="show && goal"
          @click.self="$emit('close')"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6"
      >
        <div
            role="dialog" aria-modal="true"
            class="card-bg w-full max-w-3xl rounded-3xl border border-token shadow-xl
                 max-h-[min(92dvh,900px)] overflow-y-auto
                 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
        >
          <!-- Header -->
          <div class="sticky top-0 z-10 card-bg border-b border-token px-8 pt-6 pb-4">
            <div class="flex items-center justify-between">
              <button @click="$emit('close')" class="p-2 rounded-full hover:bg-[var(--color-background-soft)] transition">
                <X class="w-6 h-6 text-text-secondary"/>
              </button>
              <div class="text-right">
                <h3 class="text-2xl font-extrabold text-[var(--color-heading)] flex items-center gap-2 justify-end">
                  <BarChart3 class="w-6 h-6 text-[var(--color-secondary)]"/>
                  {{ goal.title }}
                </h3>
                <div class="flex items-center justify-end gap-2 mt-2">
                  <span class="chip chip-primary subtle">
                    <component :is="statusIcons[goal.status]" class="w-4 h-4"/>
                    {{ statusLabels[goal.status] }}
                  </span>
                  <span class="chip chip-secondary subtle">
                    <component :is="priorityIcons[goal.priority]" class="w-4 h-4"/>
                    {{ priorityLabels[goal.priority] }}
                  </span>
                  <span v-if="goal.parent_title" class="chip chip-neutral subtle">
                    <Target class="w-4 h-4"/>
                    والد: {{ goal.parent_title }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="px-8 py-6 space-y-8">
            <!-- ردیف ۱ -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div class="flex items-center justify-center">
                <svg v-if="goal.stats" width="160" height="160" viewBox="0 0 160 160" class="drop-shadow-sm">
                  <circle cx="80" cy="80" r="64" fill="none" stroke="var(--color-border)" stroke-width="14"/>
                  <circle
                      cx="80" cy="80" r="64" fill="none"
                      :stroke="`color-mix(in oklab, var(--color-primary) ${Math.max(35, calculateProgress(goal.stats))}%, white)`"
                      stroke-width="14" stroke-linecap="round"
                      :stroke-dasharray="`${2*Math.PI*64}`"
                      :stroke-dashoffset="`${2*Math.PI*64 * (1 - (calculateProgress(goal.stats)/100))}`"
                      transform="rotate(-90 80 80)"
                  />
                  <text x="80" y="86" text-anchor="middle" font-size="28" font-weight="800" fill="var(--color-heading)">
                    {{ calculateProgress(goal.stats) }}%
                  </text>
                </svg>
                <div v-else class="text-sm text-text-secondary/70">آماری موجود نیست</div>
              </div>

              <div class="md:col-span-2 grid grid-cols-2 gap-4">
                <div class="metric-card row accent-primary">
                  <CheckCircle class="w-5 h-5 text-[var(--color-primary)]"/>
                  <div class="ml-3">
                    <div class="metric-label">انجام‌شده</div>
                    <div class="metric-value text-2xl">{{ goal.stats?.done ?? 0 }}</div>
                  </div>
                </div>

                <div class="metric-card row accent-accent">
                  <ListTree class="w-5 h-5 text-[var(--color-accent)]"/>
                  <div class="ml-3">
                    <div class="metric-label">کل تسک‌ها</div>
                    <div class="metric-value text-2xl">{{ goal.stats?.total ?? 0 }}</div>
                  </div>
                </div>

                <div class="metric-card row accent-secondary">
                  <TrendingUp class="w-5 h-5 text-[var(--color-secondary)]"/>
                  <div class="ml-3">
                    <div class="metric-label">بهترین استریک موفق</div>
                    <div class="metric-value">{{ goal.stats?.max_streak_success?.length ?? 0 }}</div>
                  </div>
                </div>

                <div class="metric-card row accent-neutral">
                  <TrendingDown class="w-5 h-5 text-[var(--color-heading)]/70"/>
                  <div class="ml-3">
                    <div class="metric-label">بیشترین شکست متوالی</div>
                    <div class="metric-value">{{ goal.stats?.max_streak_fail?.length ?? 0 }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ردیف ۲ -->
            <div>
              <div class="flex items-center justify-between text-sm mb-2 text-[var(--color-heading)] font-bold">
                <span>پیشرفت کل</span>
                <span v-if="goal.stats">%{{ calculateProgress(goal.stats) }}</span>
              </div>
              <div class="progress-rtl w-full bg-[var(--color-border)] rounded-full h-3">
                <div class="bar h-3 rounded-full transition-all duration-500"
                     :style="{ width: `${calculateProgress(goal.stats || {total:0,done:0})}%`, background: progressColor(calculateProgress(goal.stats || {total:0,done:0})) }">
                </div>
              </div>
              <div class="text-xs text-text-secondary/80 mt-2">
                انجام‌شده: <b>{{ goal.stats?.done ?? 0 }}</b> از <b>{{ goal.stats?.total ?? 0 }}</b>
              </div>
            </div>

            <!-- ردیف ۳ -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="metric-card row accent-primary">
                <TrendingUp class="w-6 h-6 text-[var(--color-primary)] flex-shrink-0"/>
                <div class="flex flex-col text-right flex-grow mx-4">
                  <span class="metric-title">بهترین استریک موفق</span>
                  <span class="metric-sub">
                    {{ formatRange(goal.stats?.max_streak_success?.start, goal.stats?.max_streak_success?.end) }}
                  </span>
                </div>
                <span class="metric-badge">{{ goal.stats?.max_streak_success?.length ?? 0 }}</span>
              </div>

              <div class="metric-card row accent-secondary">
                <TrendingDown class="w-6 h-6 text-[var(--color-secondary)] flex-shrink-0"/>
                <div class="flex flex-col text-right flex-grow mx-4">
                  <span class="metric-title">بیشترین شکست متوالی</span>
                  <span class="metric-sub">
                    {{ formatRange(goal.stats?.max_streak_fail?.start, goal.stats?.max_streak_fail?.end) }}
                  </span>
                </div>
                <span class="metric-badge">{{ goal.stats?.max_streak_fail?.length ?? 0 }}</span>
              </div>
            </div>

            <!-- ردیف ۴ -->
            <div class="metric-grid">
              <div class="metric-card row">
                <Hash class="w-5 h-5 text-[var(--color-heading)]/70"/>
                <div class="ml-3">
                  <div class="metric-label">شناسه</div>
                  <div class="metric-value">{{ goal.id }}</div>
                </div>
              </div>
              <div class="metric-card row">
                <Calendar class="w-5 h-5 text-[var(--color-heading)]/70"/>
                <div class="ml-3">
                  <div class="metric-label">تاریخ ایجاد</div>
                  <div class="metric-value">{{ toPersianDate(goal.created_at) }}</div>
                </div>
              </div>
              <div class="metric-card row">
                <ListTree class="w-5 h-5 text-[var(--color-heading)]/70"/>
                <div class="ml-3">
                  <div class="metric-label">زیرمجموعه‌ها</div>
                  <div class="metric-value">{{ goal.children_count ?? 0 }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="sticky bottom-0 card-bg border-t border-token px-8 py-5">
            <div class="flex justify-end">
              <button @click="$emit('close')"
                      class="tap-target px-5 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]
                             text-white transition font-medium shadow-md shadow-[var(--color-primary)]/25">
                بستن
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { toPersianDate } from '@/utils/date'
import {
  X, BarChart3, Target, CheckCircle, ListTree, TrendingUp, TrendingDown, Hash, Calendar
} from 'lucide-vue-next'
defineEmits(['close']) 
const props = defineProps({
  show: Boolean,
  goal: Object
})

const statusLabels = { pending: 'در انتظار', in_progress: 'در حال انجام', completed: 'تکمیل شده' }
const priorityLabels = { high: 'بالا', medium: 'متوسط', low: 'پایین' }
const statusIcons = { pending: TrendingDown, in_progress: ListTree, completed: CheckCircle }
const priorityIcons = { high: TrendingUp, medium: CheckCircle, low: Target }

function calculateProgress(stats) {
  if (!stats || stats.total === 0 || stats.total == null) return 0
  return Math.round((stats.done / stats.total) * 100)
}
function progressColor(percentage) {
  if (percentage >= 80) return 'color-mix(in oklab, var(--color-primary) 70%, white)'
  if (percentage >= 40) return 'color-mix(in oklab, var(--color-accent) 55%, white)'
  return 'color-mix(in oklab, var(--color-secondary) 60%, white)'
}
function formatRange(start, end) {
  if (!start && !end) return '—'
  if (start && !end) return toPersianDate(start)
  if (!start && end) return toPersianDate(end)
  const s = new Date(start), e = new Date(end)
  const [from, to] = s <= e ? [start, end] : [end, start]
  return `${toPersianDate(from)} تا ${toPersianDate(to)}`
}
</script>

<style scoped>
.progress-rtl { display: flex; border-radius: 999px; overflow: hidden; }
.progress-rtl > .bar { margin-left: auto; }
.metric-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
@media (min-width: 768px) { .metric-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.metric-card {
  background: color-mix(in oklab, var(--color-background-soft) 90%, white);
  border: 1px solid color-mix(in oklab, var(--color-border) 80%, white);
  border-radius: 0.875rem;
  padding: 1rem;
  display: flex; flex-direction: column; justify-content: center;
}
.metric-card.row { flex-direction: row; align-items: center; }
.metric-label { font-size: .75rem; color: color-mix(in oklab, var(--color-text) 78%, white); margin-bottom: .25rem; }
.metric-title { font-weight: 800; color: var(--color-heading); }
.metric-sub { font-size: .85rem; color: color-mix(in oklab, var(--color-text) 88%, white); }
.metric-value { font-weight: 800; color: var(--color-heading); font-size: 1.1rem; }
.metric-badge {
  font-weight: 900; padding: .25rem .7rem; border-radius: .75rem;
  background: color-mix(in oklab, var(--color-primary) 10%, white);
  color: var(--color-primary);
  border: 1px solid color-mix(in oklab, var(--color-primary) 24%, var(--color-border));
}
.metric-card.accent-primary {
  background: color-mix(in oklab, var(--color-primary) 5%, var(--color-background));
  border-color: color-mix(in oklab, var(--color-primary) 22%, var(--color-border));
}
.metric-card.accent-secondary {
  background: color-mix(in oklab, var(--color-secondary) 5%, var(--color-background));
  border-color: color-mix(in oklab, var(--color-secondary) 22%, var(--color-border));
}
.metric-card.accent-accent {
  background: color-mix(in oklab, var(--color-accent) 5%, var(--color-background));
  border-color: color-mix(in oklab, var(--color-accent) 22%, var(--color-border));
}
.metric-card.accent-neutral {
  background: color-mix(in oklab, var(--color-border) 10%, var(--color-background));
  border-color: color-mix(in oklab, var(--color-border) 55%, white);
}
.fade-scale-enter-active,
.fade-scale-leave-active { transition: all 0.28s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
.fade-scale-enter-from,
.fade-scale-leave-to { opacity: 0; transform: scale(0.98) translateY(8px); }
.fade-scale-enter-to,
.fade-scale-leave-from { opacity: 1; transform: scale(1) translateY(0); }
</style>
