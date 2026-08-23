<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import BaseSelect from '@/components/UI/BaseSelect.vue'
import BaseButton from '@/components/UI/BaseButton.vue'
import { X } from 'lucide-vue-next'

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
            class="card-bg w-full max-w-md rounded-2xl border border-token shadow-2xl
                 px-6 py-6 md:px-8 md:py-8 transition-all duration-300 space-y-6"
            role="dialog"
            aria-modal="true"
        >
          <!-- Header -->
          <div class="flex items-start justify-between">
            <div class="flex flex-col items-end space-y-2 text-right">
              <h3 class="text-2xl font-extrabold text-[var(--color-heading)] leading-snug">
                افزودن کار
              </h3>
              <p class="text-sm text-text-secondary leading-relaxed max-w-sm">
                یکی از اهدافت را انتخاب کن تا برای امروز یک کار ساخته شود.
              </p>
            </div>
            <button
                type="button"
                @click="emit('close')"
                class="tap-target p-2 rounded-full hover-surface-mute transition"
                aria-label="بستن"
            >
              <X class="w-5 h-5 text-[var(--color-text-secondary)]" aria-hidden="true" />
            </button>
          </div>

          <!-- Body -->
          <div class="space-y-5 pt-2">
            <BaseSelect
                v-model="selectedGoalId"
                :options="availableGoals.map(g => ({ value: g.id, label: g.title }))"
                name="هدف"
                placeholder="انتخاب هدف"
                class="w-full"
            />

            <div v-if="!availableGoals.length"
                 class="text-xs text-text-secondary text-center bg-[var(--color-background-soft)]
                        rounded-xl border border-token p-3">
              برای همه اهداف امروز کار ثبت شده است، یا هنوز هدفی نساخته‌ای.
            </div>
          </div>

          <!-- Footer -->
          <div class="flex justify-end gap-3 pt-6 border-t border-token">
            <BaseButton variant="ghost" @click="emit('close')">انصراف</BaseButton>
            <BaseButton :disabled="!selectedGoalId" @click="submit">افزودن کار</BaseButton>
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
