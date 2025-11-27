<template>
  <Teleport to="body">
    <transition name="fade-scale">
      <div
        v-if="show"
        @click.self="$emit('cancel')"
        class="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-[3px] p-4"
      >
        <div
          role="dialog"
          aria-modal="true"
          class="card-bg border border-token rounded-3xl w-full max-w-md p-8 shadow-[0_10px_25px_-10px_rgba(0,0,0,0.25)]
                 transition-all duration-300 hover:shadow-[0_12px_28px_-10px_rgba(0,0,0,0.28)]"
        >
          <!-- Header -->
          <div class="flex items-center justify-end gap-3 mb-6">
            <Trash2 class="w-7 h-7 text-[var(--color-secondary)] drop-shadow-sm" />
            <h3 class="text-2xl font-extrabold text-[var(--color-heading)] tracking-tight">
              حذف هدف
            </h3>
          </div>

          <!-- Body -->
          <p class="text-[var(--color-text)]/90 leading-relaxed text-sm sm:text-base mb-8" dir="rtl">
            آیا واقعاً مطمئن هستی که می‌خواهی این هدف را حذف کنی؟
            <br />
            <span class="text-[var(--color-secondary)] font-semibold" dir="rtl">
              این عمل قابل بازگشت نیست.
            </span>
          </p>

          <!-- Footer -->
          <div class="flex justify-end gap-3 pt-4 border-t border-[color-mix(in_oklab,var(--color-border)_75%,white)]">
            <button
              @click="$emit('cancel')"
              class="tap-target px-5 py-2.5 rounded-xl font-medium transition
                     bg-[var(--color-background-soft)] border border-[var(--color-border)]
                     text-[var(--color-text)] shadow-inner-sm hover:shadow-md
                     hover:bg-[var(--color-background)] hover:translate-y-[-1px]"
            >
              لغو
            </button>

            <button
              @click="$emit('confirm', goalId)"
              class="tap-target px-6 py-2.5 rounded-xl font-semibold text-white
                     bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]
                     shadow-md shadow-[var(--color-primary)]/30
                     transition-all duration-200 hover:translate-y-[-1px] active:scale-[0.98]"
            >
              حذف کن
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { Trash2 } from 'lucide-vue-next'

defineEmits(['cancel', 'confirm'])
const props = defineProps({
  show: Boolean,
  goalId: Number,
})
</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.28s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(14px);
}
.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* نرمی سایه داخلی */
.shadow-inner-sm {
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
}
</style>
