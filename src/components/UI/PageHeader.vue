<script setup>
/**
 * Header block shared by every signed-in page.
 *
 * Keeps the title size, weight and the position of the page's main action
 * identical across tabs. The action lives in the `actions` slot so each page
 * decides what the button does without moving where it sits.
 */
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  // Optional lucide component rendered next to the title.
  icon: { type: [Object, Function], default: null },
})
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div class="min-w-0">
      <h1
        class="flex items-center gap-2 text-xl sm:text-2xl font-extrabold text-[var(--color-heading)]"
      >
        <component
          :is="icon"
          v-if="icon"
          class="w-6 h-6 text-[var(--color-primary)]"
          aria-hidden="true"
        />
        <span class="truncate">{{ title }}</span>
      </h1>

      <p v-if="subtitle" class="mt-1 text-sm text-[var(--color-text-secondary)]">
        {{ subtitle }}
      </p>
    </div>

    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2 sm:justify-end">
      <slot name="actions" />
    </div>
  </div>
</template>
