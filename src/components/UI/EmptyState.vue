<script setup>
/**
 * Shared "there is nothing to show" panel.
 *
 * Three different situations used to look identical — a grey sentence in the
 * middle of the page — so the user could not tell "you have not created
 * anything yet" apart from "your filter matched nothing" or "the request
 * failed". The `variant` prop keeps those three apart:
 *
 *   empty  → the account genuinely has no data yet; the action creates some.
 *   filter → data exists but the current search/filter hides it; the action
 *            clears the filter, it never creates a record.
 *   error  → fetching failed; the action retries.
 *
 * The icon follows the variant so the distinction survives without reading the
 * text, and the action button is only rendered when a caller supplies a label.
 * `icon` overrides the default when a page has a more specific symbol.
 *
 * The companion of LoadingState, which covers the wait before any of these
 * three is known.
 */
import { computed } from 'vue'
import { AlertTriangle, Inbox, SearchX } from 'lucide-vue-next'
import BaseButton from '@/components/UI/BaseButton.vue'

const props = defineProps({
  // empty | filter | error
  variant: { type: String, default: 'empty' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
  // Overrides the variant default; expects a component, not a name.
  icon: { type: [Object, Function], default: null },
  compact: { type: Boolean, default: false },
})

defineEmits(['action'])

const VARIANT_ICONS = {
  empty: Inbox,
  filter: SearchX,
  error: AlertTriangle,
}

const iconComponent = computed(() => props.icon || VARIANT_ICONS[props.variant] || Inbox)

// Only a failure is worth colouring as a failure; the other two are ordinary
// states, not problems.
const isError = computed(() => props.variant === 'error')
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-token surface-soft px-4 text-center"
    :class="compact ? 'py-8' : 'py-12'"
    dir="rtl"
    :role="isError ? 'alert' : undefined"
  >
    <span
      class="flex h-12 w-12 items-center justify-center rounded-2xl state-icon"
      :class="{ 'is-error': isError }"
    >
      <component :is="iconComponent" class="h-6 w-6" aria-hidden="true" />
    </span>

    <p class="text-base font-bold text-[var(--color-heading)]">{{ title }}</p>

    <p
      v-if="description"
      class="max-w-sm text-sm leading-6 text-[var(--color-text-secondary)]"
    >
      {{ description }}
    </p>

    <BaseButton
      v-if="actionLabel"
      :variant="isError ? 'secondary' : 'primary'"
      size="sm"
      class="mt-1"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </BaseButton>
  </div>
</template>

<style scoped>
.state-icon {
  background: color-mix(in oklab, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
}

.state-icon.is-error {
  background: color-mix(in oklab, var(--color-danger) 12%, transparent);
  color: var(--color-danger);
}
</style>
