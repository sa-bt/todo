<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import BaseSelect from '@/components/UI/BaseSelect.vue'

const props = defineProps({
  goals: { type: Array, required: true },
  tasks: { type: Array, required: true },
})

const emit = defineEmits(['close', 'add'])
const selectedGoalId = ref(null)

const availableGoals = computed(() => {
  const taken = props.tasks.map(t => t.goal_id)
  return props.goals.filter(g => !taken.includes(g.id))
})

function submit() {
  if (!selectedGoalId.value) return
  emit('add', selectedGoalId.value)
}
</script>

<template>
  <Teleport to="body">
    <transition name="fade-scale">
      <div
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 md:p-8"
          @click.self="emit('close')"
      >
        <div
            class="card-bg w-full max-w-md rounded-3xl border border-token shadow-2xl
                 px-8 py-8 md:py-10 transition-all duration-300 space-y-8"
            role="dialog"
            aria-modal="true"
        >
          <!-- Header -->
          <div class="flex items-start justify-between">
            <div class="flex flex-col items-end space-y-2 text-right">
              <h3 class="text-2xl font-extrabold text-[var(--color-heading)] leading-snug">
                افزودن تسک جدید
              </h3>
              <p class="text-sm text-text-secondary leading-relaxed max-w-sm">
                یکی از اهداف خود را انتخاب کن تا برای امروز یک تسک ایجاد شود.
              </p>
            </div>
            <button
                @click="emit('close')"
                class="p-2 rounded-full hover:bg-[var(--color-background-mute)] transition ml-2"
                aria-label="بستن"
            >
              <svg xmlns="http://www.w3.org/2000/svg"
                   class="w-6 h-6 text-[var(--color-heading)] opacity-80 hover:opacity-100"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="space-y-5 pt-2">
            <BaseSelect
                v-model="selectedGoalId"
                :options="availableGoals.map(g => ({ value: g.id, label: g.title }))"
                placeholder="-- انتخاب هدف --"
                class="w-full"
            />

            <div v-if="!availableGoals.length"
                 class="text-xs text-text-secondary text-center bg-[var(--color-background-soft)]
                        rounded-xl border border-token p-3">
              🎯 همهٔ اهداف امروز تسک دارند یا هدفی برای انتخاب موجود نیست.
            </div>
          </div>

          <!-- Footer -->
          <div class="flex justify-end gap-3 pt-8 border-t border-token">
            <button
                @click="emit('close')"
                class="tap-target px-6 py-2.5 rounded-xl bg-[var(--color-background-soft)]
                     hover:bg-[var(--color-background)] border border-token font-medium
                     text-[var(--color-text)] transition"
            >
              لغو
            </button>

            <button
                @click="submit"
                :disabled="!selectedGoalId"
                class="tap-target px-6 py-2.5 rounded-xl font-semibold
                     transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed
                     bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]
                     text-white shadow-[var(--color-primary)]/25"
            >
              افزودن تسک
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.28s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}
.card-bg {
  background-color: var(--color-background);
}
</style>
