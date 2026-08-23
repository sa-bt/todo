<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { AlertTriangle, HelpCircle } from 'lucide-vue-next'
import BaseButton from '@/components/UI/BaseButton.vue'

/**
 * Shared confirmation dialog.
 *
 * Replaces the native browser confirm(), which does not follow the panel theme
 * and cannot show a busy state while the request is in flight. Keep the dialog
 * open while `loading` is true so the user sees the action being carried out.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  confirmLabel: { type: String, default: 'تأیید' },
  cancelLabel: { type: String, default: 'انصراف' },
  // primary | danger — drives both the icon tint and the confirm button.
  variant: { type: String, default: 'primary' },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])

const confirmButton = ref(null)

function onCancel() {
  if (props.loading) return
  emit('cancel')
}

// Escape has to be bound on the window: the backdrop is not focusable, so a
// keydown handler placed on it would never fire.
function onKeydown(event) {
  if (event.key === 'Escape') onCancel()
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) {
      window.removeEventListener('keydown', onKeydown)
      return
    }

    window.addEventListener('keydown', onKeydown)

    // Move focus onto the safe default so the dialog is usable from a keyboard.
    await nextTick()
    confirmButton.value?.$el?.focus?.()
  },
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
        @click.self="onCancel"
      >
        <div
          class="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-2xl"
          role="alertdialog"
          aria-modal="true"
          :aria-label="title"
          dir="rtl"
        >
          <div
            class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            :class="variant === 'danger' ? 'bg-red-500/10' : 'bg-[var(--color-primary)]/10'"
          >
            <AlertTriangle v-if="variant === 'danger'" class="h-7 w-7 text-red-600" aria-hidden="true" />
            <HelpCircle v-else class="h-7 w-7 text-[var(--color-primary)]" aria-hidden="true" />
          </div>

          <h2 class="text-center text-lg font-extrabold text-[var(--color-heading)]">
            {{ title }}
          </h2>
          <p
            v-if="message"
            class="mt-3 text-center text-sm leading-6 text-[var(--color-text-secondary)]"
          >
            {{ message }}
          </p>

          <div class="mt-6 flex gap-3">
            <BaseButton
              ref="confirmButton"
              :variant="variant === 'danger' ? 'danger' : 'primary'"
              :loading="loading"
              block
              @click="emit('confirm')"
            >
              {{ confirmLabel }}
            </BaseButton>
            <BaseButton variant="ghost" :disabled="loading" block @click="onCancel">
              {{ cancelLabel }}
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.18s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}
</style>
