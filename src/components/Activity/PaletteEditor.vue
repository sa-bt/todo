<script setup>
/*
 * پنجره تنظیم رنگ‌بندی نتایج.
 *
 * همین یک کامپوننت، هم در تب تنظیمات نشان داده می‌شود و هم داخل پنجره تب
 * گزارش‌ها. رنگ‌بندی یک سیستم است، پس دو رابط کاربری جدا برایش ساخته نشد.
 *
 * کار روی یک نسخه پیش‌نویس انجام می‌شود، نه روی خود استور. تا کاربر ذخیره
 * نکرده، صفحه گزارش عوض نمی‌شود؛ ولی پیش‌نمایش همین‌جا زنده است.
 */
import { computed, ref, watch } from 'vue'
import { Plus, RotateCcw, Trash2, Save } from 'lucide-vue-next'
import { useActivityPaletteStore } from '@/stores/activityPalette'
import { useNotificationStore } from '@/stores/notification'
import { toPersianNumber } from '@/utils/number'
import {
  MAX_LEVELS,
  MIN_LEVELS,
  cloneLevels,
  isValidColor,
  levelOf,
  lowerBoundOf,
  onColorOf,
  validateLevels,
} from '@/utils/activityLevel'

const emit = defineEmits(['saved'])

const palette = useActivityPaletteStore()
const notify = useNotificationStore()

const draft = ref(cloneLevels(palette.levels))

// اگر رنگ‌بندی از جای دیگری عوض شد (مثلاً پنجره دیگر یا ورود کاربر تازه)،
// پیش‌نویس هم باید همان را نشان بدهد.
watch(
  () => palette.levels,
  levels => {
    draft.value = cloneLevels(levels)
  },
  { deep: true },
)

const rows = computed(() =>
  draft.value.map((level, index) => ({
    index,
    color: level.color,
    upTo: level.upTo,
    from: lowerBoundOf(draft.value, index),
    isLast: index === draft.value.length - 1,
  })),
)

const error = computed(() => validateLevels(draft.value))

const isDirty = computed(
  () =>
    JSON.stringify(draft.value.map(l => [l.color.toLowerCase(), l.upTo])) !==
    JSON.stringify(palette.levels.map(l => [l.color.toLowerCase(), l.upTo])),
)

const rangeText = row => `${toPersianNumber(row.from)}٪ تا ${toPersianNumber(row.upTo)}٪`

/*
 * پیش‌نمایش: نواری که پهنای هر تکه‌اش به اندازه دامنه همان سطح است. کاربر با یک
 * نگاه می‌بیند کدام سطح چقدر از صد درصد را برداشته.
 */
const previewSegments = computed(() =>
  rows.value.map(row => ({
    ...row,
    width: Math.max(0, row.upTo - row.from + 1),
    onColor: onColorOf(row.color),
  })),
)

// چند درصد نمونه، تا کاربر ببیند یک عدد واقعی چه رنگی می‌گیرد.
const SAMPLE_PERCENTS = [12, 38, 57, 74, 96]

const samples = computed(() =>
  SAMPLE_PERCENTS.map(percent => {
    const level = levelOf(100, percent, false, draft.value)
    const color = draft.value[level - 1]?.color ?? '#888888'

    return { percent, color, onColor: onColorOf(color) }
  }),
)

/*
 * خود این پنجره هم رنگ هشدارش را از پیش‌نویس می‌گیرد، نه از رنگ ثابت. وگرنه
 * جایی که کاربر رنگ‌ها را عوض می‌کند، خودش تنها جای بیرون‌مانده از سیستم می‌شد.
 */
const editorVars = computed(() => ({
  '--activity-worst': draft.value[0]?.color ?? '#DC2626',
}))

function setColor(index, value) {
  if (!isValidColor(value)) return

  draft.value[index].color = value.trim().toLowerCase()
}

/*
 * کد رنگ دستی. اگر ورودی معتبر نبود، خانه به رنگ فعلی برمی‌گردد؛ وگرنه متن
 * بی‌معنا در کادر می‌ماند و کاربر فکر می‌کند رنگ عوض شده.
 */
function setColorFromText(index, input) {
  if (isValidColor(input.value)) {
    setColor(index, input.value)
    return
  }

  input.value = draft.value[index].color
}

function setUpTo(index, value) {
  const parsed = Number(value)

  draft.value[index].upTo = Number.isFinite(parsed) ? Math.round(parsed) : 0
}

/*
 * سطح تازه در فاصله میان مرز یکی‌مانده‌به‌آخر و صد ساخته می‌شود، تا مرز آخرین
 * سطح دست‌نخورده روی صد بماند.
 */
function addLevel() {
  if (draft.value.length >= MAX_LEVELS) return

  const previousBound = draft.value.length >= 2 ? draft.value[draft.value.length - 2].upTo : 0
  const bound = Math.floor((previousBound + 100) / 2)

  if (bound <= previousBound || bound > 99) {
    notify.setNotification({
      message: 'جایی برای سطح تازه نماند. اول مرزها را باز کن.',
      type: 'error',
    })
    return
  }

  draft.value.splice(draft.value.length - 1, 0, {
    color: draft.value[draft.value.length - 1].color,
    upTo: bound,
  })
}

function removeLevel(index) {
  if (draft.value.length <= MIN_LEVELS) return

  draft.value.splice(index, 1)

  // مرز بالای آخرین سطح همیشه صد است، حتی اگر همان سطح حالا حذف شده باشد.
  draft.value[draft.value.length - 1].upTo = 100
}

function submit() {
  if (error.value) {
    notify.setNotification({ message: error.value, type: 'error', icon: 'alert-triangle' })
    return
  }

  // پیامی که برمی‌گردد یعنی ذخیره در حافظه مرورگر انجام نشد، نه اینکه پالت رد شد.
  const message = palette.save(draft.value)

  notify.setNotification({
    message: message || 'رنگ‌بندی نتایج ذخیره شد',
    type: message ? 'warning' : 'success',
    icon: 'sparkles',
    duration: 3500,
  })

  emit('saved')
}

function restoreDefaults() {
  palette.reset()
  draft.value = cloneLevels(palette.levels)

  notify.setNotification({ message: 'رنگ‌بندی به حالت پیش‌فرض برگشت', type: 'success' })
}
</script>

<template>
  <div class="palette-editor" :style="editorVars">
    <p class="editor-note">
      این رنگ‌بندی همه‌جای گزارش‌ها را با هم می‌سازد؛ نقشه سالانه، هفته‌ها، ماه‌ها، اهداف و الگو.
      پس یک درصد، هرجا که بیاید، یک رنگ دارد.
    </p>

    <!-- پیش‌نمایش -->
    <div class="preview-block">
      <div class="preview-bar">
        <div
          v-for="segment in previewSegments"
          :key="segment.index"
          class="preview-seg"
          :style="{ flexGrow: segment.width, backgroundColor: segment.color, color: segment.onColor }"
        >
          <span v-if="segment.width >= 8">{{ toPersianNumber(segment.upTo) }}</span>
        </div>
      </div>

      <div class="preview-samples">
        <span
          v-for="sample in samples"
          :key="sample.percent"
          class="sample-chip"
          :style="{ backgroundColor: sample.color, color: sample.onColor }"
        >
          {{ toPersianNumber(sample.percent) }}٪
        </span>
      </div>
    </div>

    <!-- سطح‌ها -->
    <div class="levels-list">
      <div v-for="row in rows" :key="row.index" class="level-row">
        <span class="level-index">{{ toPersianNumber(row.index + 1) }}</span>

        <label class="color-well" :style="{ backgroundColor: row.color }">
          <input
            type="color"
            class="color-input"
            :value="row.color"
            :aria-label="`رنگ سطح ${toPersianNumber(row.index + 1)}`"
            @input="setColor(row.index, $event.target.value)"
          />
        </label>

        <div class="level-body">
          <span class="level-range">{{ rangeText(row) }} بازدهی</span>
          <input
            type="text"
            class="hex-input"
            dir="ltr"
            :value="row.color"
            :aria-label="`کد رنگ سطح ${toPersianNumber(row.index + 1)}`"
            @change="setColorFromText(row.index, $event.target)"
          />
        </div>

        <div class="bound-box">
          <span class="bound-label">تا</span>
          <input
            v-if="!row.isLast"
            type="number"
            class="bound-input"
            min="1"
            max="99"
            :value="row.upTo"
            :aria-label="`مرز بالای سطح ${toPersianNumber(row.index + 1)}`"
            @input="setUpTo(row.index, $event.target.value)"
          />
          <span v-else class="bound-fixed">{{ toPersianNumber(100) }}</span>
          <span class="bound-label">٪</span>
        </div>

        <button
          type="button"
          class="row-remove"
          :disabled="draft.length <= MIN_LEVELS"
          :title="draft.length <= MIN_LEVELS ? 'کمتر از دو سطح ممکن نیست' : 'حذف این سطح'"
          @click="removeLevel(row.index)"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <p class="editor-hint">
      روز بدون تسک سطح ندارد و رنگش از تم می‌آید، چون معنایش «نبود داده» است نه بازدهی کم.
    </p>

    <p v-if="error" class="editor-error">{{ error }}</p>

    <div class="editor-actions">
      <button
        type="button"
        class="btn-add"
        :disabled="draft.length >= MAX_LEVELS"
        @click="addLevel"
      >
        <Plus class="w-4 h-4" />
        سطح تازه
      </button>

      <button type="button" class="btn-reset" :disabled="palette.isDefault" @click="restoreDefaults">
        <RotateCcw class="w-4 h-4" />
        پیش‌فرض
      </button>

      <button
        type="button"
        class="btn-save"
        :disabled="!!error || !isDirty"
        @click="submit"
      >
        <Save class="w-4 h-4" />
        ذخیره رنگ‌بندی
      </button>
    </div>
  </div>
</template>

<style scoped>
.palette-editor { display: flex; flex-direction: column; gap: 14px; }

.editor-note, .editor-hint {
  font-size: 11.5px;
  line-height: 1.9;
  color: var(--color-text-secondary);
  margin: 0;
}

.editor-hint { font-size: 11px; opacity: .85; }

.preview-block { display: flex; flex-direction: column; gap: 8px; }

.preview-bar {
  display: flex;
  height: 26px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.preview-seg {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  min-width: 8px;
  transition: background-color .2s ease;
}

.preview-samples { display: flex; flex-wrap: wrap; gap: 6px; }

.sample-chip {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.levels-list { display: flex; flex-direction: column; gap: 8px; }

.level-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 14px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
}

.level-index {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: var(--color-background-mute);
  color: var(--color-text-secondary);
  font-size: 10px;
  font-weight: 800;
}

.color-well {
  position: relative;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  cursor: pointer;
  overflow: hidden;
}

.color-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  border: 0;
  padding: 0;
}

.level-body { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }

.level-range { font-size: 11.5px; font-weight: 800; color: var(--color-text); }

.hex-input {
  width: 90px;
  padding: 2px 6px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
  color: var(--color-text-secondary);
  font-size: 10.5px;
  font-family: monospace;
}

.bound-box { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }

.bound-label { font-size: 10px; color: var(--color-text-secondary); }

.bound-input, .bound-fixed {
  width: 52px;
  padding: 5px 6px;
  border-radius: 9px;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
  color: var(--color-text);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.bound-fixed { border-style: dashed; color: var(--color-text-secondary); }

.row-remove {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: transparent;
  color: var(--color-text-secondary);
  transition: all .15s ease;
}

.row-remove:hover:not(:disabled) {
  background: color-mix(in srgb, var(--activity-worst, #DC2626) 12%, transparent);
  color: var(--activity-worst, #DC2626);
}

.row-remove:disabled { opacity: .3; cursor: not-allowed; }

.editor-error {
  margin: 0;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--activity-worst, #DC2626);
}

.editor-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }

.editor-actions button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  transition: all .15s ease;
}

.editor-actions button:hover:not(:disabled) { background: var(--color-background-mute); }

.editor-actions button:disabled { opacity: .45; cursor: not-allowed; }

.btn-save {
  margin-inline-start: auto;
  background: var(--color-primary) !important;
  border-color: var(--color-primary) !important;
  color: #fff !important;
}

.btn-save:hover:not(:disabled) { background: var(--color-primary-hover) !important; }

@media (max-width: 520px) {
  .level-row { flex-wrap: wrap; }
  .level-body { flex-basis: 100%; order: 3; }
  .btn-save { margin-inline-start: 0; width: 100%; justify-content: center; }
}
</style>
