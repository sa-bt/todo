<script setup>
import { computed } from 'vue'
import { toPersianDate } from '@/utils/date'
import {
  X, BarChart3, Target, CheckCircle, ListTree, TrendingUp, TrendingDown,
  Calendar, Hash
} from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, required: true },
  goal: { type: Object, required: true },
  calculateProgress: { type: Function, required: true },
  progressColor: { type: Function, required: true },
  formatRange: { type: Function, required: true },
  statusLabels: { type: Object, required: true },
  priorityLabels: { type: Object, required: true },
  statusIcons: { type: Object, required: true },
  priorityIcons: { type: Object, required: true },
})
const emit = defineEmits(['close'])

const visible = computed(() => props.show)
</script>

<template>
  <Teleport to="body">
    <transition name="fade-scale">
      <div
          v-if="visible && goal"
          @click.self="emit('close')"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6"
      >
        <div
            class="card-bg w-full max-w-3xl rounded-3xl border border-token shadow-xl
                 max-h-[min(92dvh,900px)] overflow-y-auto
                 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
        >
          <!-- Header -->
          <div class="sticky top-0 z-10 card-bg border-b border-token px-8 pt-6 pb-4">
            <div class="flex items-center justify-between">
              <button @click="emit('close')" class="p-2 rounded-full hover:bg-[var(--color-background-soft)] transition">
                <X class="w-6 h-6 text-text-secondary" />
              </button>
              <div class="text-right">
                <h3 class="text-2xl font-extrabold text-[var(--color-heading)] flex items-center gap-2 justify-end">
                  <BarChart3 class="w-6 h-6 text-[var(--color-secondary)]" />
                  {{ goal.title }}
                </h3>
                <div class="flex items-center justify-end gap-2 mt-2">
                  <span class="chip chip-primary subtle">
                    <component :is="statusIcons[goal.status]" class="w-4 h-4" />
                    {{ statusLabels[goal.status] }}
                  </span>
                  <span class="chip chip-secondary subtle">
                    <component :is="priorityIcons[goal.priority]" class="w-4 h-4" />
                    {{ priorityLabels[goal.priority] }}
                  </span>
                  <span v-if="goal.parent_title" class="chip chip-neutral subtle">
                    <Target class="w-4 h-4" /> والد: {{ goal.parent_title }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="px-8 py-6 space-y-8">
            <!-- Row 1: Donut + KPIs -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div class="flex items-center justify-center">
                <svg v-if="goal.stats" width="160" height="160" viewBox="0 0 160 160" class="drop-shadow-sm">
                  <circle cx="80" cy="80" r="64" fill="none" stroke="var(--color-border)" stroke-width="14" />
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

              <!-- KPI Cards -->
              <div class="md:col-span-2 grid grid-cols-2 gap-4">
                <div class="metric-card row accent-primary">
                  <CheckCircle class="w-5 h-5 text-[var(--color-primary)]" />
                  <div class="ml-3">
                    <div class="metric-label">انجام‌شده</div>
                    <div class="metric-value text-2xl">{{ goal.stats?.done ?? 0 }}</div>
                  </div>
                </div>

                <div class="metric-card row accent-accent">
                  <ListTree class="w-5 h-5 text-[var(--color-accent)]" />
                  <div class="ml-3">
                    <div class="metric-label">کل تسک‌ها</div>
                    <div class="metric-value text-2xl">{{ goal.stats?.total ?? 0 }}</div>
                  </div>
                </div>

                <div class="metric-card row accent-secondary">
                  <TrendingUp class="w-5 h-5 text-[var(--color-secondary)]" />
                  <div class="ml-3">
                    <div class="metric-label">بهترین استریک موفق</div>
                    <div class="metric-value">{{ goal.stats?.max_streak_success?.length ?? 0 }}</div>
                  </div>
                </div>

                <div class="metric-card row accent-neutral">
                  <TrendingDown class="w-5 h-5 text-[var(--color-heading)]/70" />
                  <div class="ml-3">
                    <div class="metric-label">بیشترین شکست متوالی</div>
                    <div class="metric-value">{{ goal.stats?.max_streak_fail?.length ?? 0 }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Row 2: Linear Progress -->
            <div>
              <div class="flex items-center justify-between text-sm mb-2 text-[var(--color-heading)] font-bold">
                <span>پیشرفت کل</span>
                <span v-if="goal.stats">%{{ calculateProgress(goal.stats) }}</span>
              </div>
              <div class="progress-rtl w-full bg-[var(--color-border)] rounded-full h-3">
                <div
                    class="bar h-3 rounded-full transition-all duration-500"
                    :style="{ width: `${calculateProgress(goal.stats || {total:0,done:0})}%`, background: progressColor(calculateProgress(goal.stats || {total:0,done:0})) }"
                ></div>
              </div>
              <div class="text-xs text-text-secondary/80 mt-2">
                انجام‌شده: <b>{{ goal.stats?.done ?? 0 }}</b> از <b>{{ goal.stats?.total ?? 0 }}</b>
              </div>
            </div>

            <!-- Row 3: Streaks -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="metric-card row accent-primary">
                <TrendingUp class="w-6 h-6 text-[var(--color-primary)] flex-shrink-0" />
                <div class="flex flex-col text-right flex-grow mx-4">
                  <span class="metric-title">بهترین استریک موفق</span>
                  <span class="metric-sub">
                    {{ formatRange(goal.stats?.max_streak_success?.start, goal.stats?.max_streak_success?.end) }}
                  </span>
                </div>
                <span class="metric-badge">{{ goal.stats?.max_streak_success?.length ?? 0 }}</span>
              </div>

              <div class="metric-card row accent-secondary">
                <TrendingDown class="w-6 h-6 text-[var(--color-secondary)] flex-shrink-0" />
                <div class="flex flex-col text-right flex-grow mx-4">
                  <span class="metric-title">بیشترین شکست متوالی</span>
                  <span class="metric-sub">
                    {{ formatRange(goal.stats?.max_streak_fail?.start, goal.stats?.max_streak_fail?.end) }}
                  </span>
                </div>
                <span class="metric-badge">{{ goal.stats?.max_streak_fail?.length ?? 0 }}</span>
              </div>
            </div>

            <!-- Row 4: Info -->
            <div class="metric-grid">
              <div class="metric-card row">
                <Hash class="w-5 h-5 text-[var(--color-heading)]/70" />
                <div class="ml-3">
                  <div class="metric-label">شناسه</div>
                  <div class="metric-value">{{ goal.id }}</div>
                </div>
              </div>
              <div class="metric-card row">
                <Calendar class="w-5 h-5 text-[var(--color-heading)]/70" />
                <div class="ml-3">
                  <div class="metric-label">تاریخ ایجاد</div>
                  <div class="metric-value">{{ toPersianDate(goal.created_at) }}</div>
                </div>
              </div>
              <div class="metric-card row">
                <ListTree class="w-5 h-5 text-[var(--color-heading)]/70" />
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
              <button
                  @click="emit('close')"
                  class="tap-target px-5 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]
                       text-white transition font-medium shadow-md shadow-[var(--color-primary)]/25"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.25s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
