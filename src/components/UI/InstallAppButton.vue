<script setup>
import { ref } from 'vue'
import { Download, Share, SquarePlus, X } from 'lucide-vue-next'
import { useInstallPrompt } from '@/utils/pwaInstall'

/**
 * Renders nothing unless the current document is actually installable, so the
 * same component can sit in the user app and in the admin panel. Styling comes
 * from the call site through attribute fallthrough.
 */
defineOptions({ inheritAttrs: false })

defineProps({
  label: { type: String, default: 'نصب برنامه' },
  appName: { type: String, default: 'Do IT' },
})

const { canInstall, needsIosGuide, promptInstall } = useInstallPrompt()

const showIosGuide = ref(false)
const busy = ref(false)

async function onClick() {
  if (!canInstall.value) {
    showIosGuide.value = true
    return
  }

  busy.value = true

  try {
    await promptInstall()
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <button
    v-if="canInstall || needsIosGuide"
    v-bind="$attrs"
    type="button"
    :disabled="busy"
    :aria-busy="busy ? 'true' : 'false'"
    @click="onClick"
  >
    <Download class="h-5 w-5 shrink-0" aria-hidden="true" />
    <span>{{ label }}</span>
  </button>

  <div
    v-if="showIosGuide"
    dir="rtl"
    class="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
    @click.self="showIosGuide = false"
  >
    <div class="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-800">
      <div class="mb-3 flex items-start justify-between gap-3">
        <h2 class="text-lg font-bold text-slate-900 dark:text-white">
          نصب «{{ appName }}» روی آیفون و آیپد
        </h2>

        <button
          type="button"
          class="rounded p-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
          aria-label="بستن راهنما"
          @click="showIosGuide = false"
        >
          <X class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <p class="mb-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
        روی iOS نصب فقط با منوی خود مرورگر انجام می‌شود و برنامه نمی‌تواند آن را باز کند.
        دو گام زیر را انجام دهید:
      </p>

      <ol class="mb-5 space-y-3 text-sm text-slate-700 dark:text-slate-200">
        <li class="flex items-center gap-3">
          <Share class="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          دکمه‌ی اشتراک‌گذاری را در نوار پایین Safari بزنید.
        </li>

        <li class="flex items-center gap-3">
          <SquarePlus class="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          گزینه‌ی «Add to Home Screen» را انتخاب کنید.
        </li>
      </ol>

      <button
        type="button"
        class="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        @click="showIosGuide = false"
      >
        متوجه شدم
      </button>
    </div>
  </div>
</template>
