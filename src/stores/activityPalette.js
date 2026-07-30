// stores/activityPalette.js
/*
 * رنگ‌بندی نتایج، در یک استور.
 *
 * هرچه در برنامه رنگش از درصد بازدهی می‌آید، از همین استور می‌گیرد. پس اگر
 * کاربر رنگ‌ها یا دامنه‌ها را عوض کند، همه‌جا با هم عوض می‌شود و «۵۷ درصد» در
 * روز و هفته و ماه هیچ‌وقت دو رنگ نمی‌شود.
 *
 * محل ذخیره: حافظه مرورگر، با کلید جدا برای هر کاربر. دو حساب روی یک مرورگر
 * رنگ‌بندی هم را نمی‌بینند. سرور دست‌نخورده ماند، پس این تنظیم روی دستگاه دیگر
 * کاربر همراهش نمی‌آید.
 */
import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import {
  DEFAULT_LEVELS,
  EMPTY_LEVEL_COLOR,
  EMPTY_LEVEL_LABEL_COLOR,
  cloneLevels,
  levelOf,
  lowerBoundOf,
  normalizeLevels,
  onColorOf,
  textColorOf,
  validateLevels,
} from '@/utils/activityLevel'

const STORAGE_PREFIX = 'activity-palette'

const storageKeyFor = userId => `${STORAGE_PREFIX}:${userId ?? 'guest'}`

export const useActivityPaletteStore = defineStore('activityPalette', () => {
  const auth = useAuthStore()

  const levels = ref(cloneLevels(DEFAULT_LEVELS))

  const storageKey = computed(() => storageKeyFor(auth.user?.id))

  /*
   * ورود و خروج کاربر باید پالت را عوض کند. `immediate` باعث می‌شود همان بار
   * اول هم خوانده شود، پس هیچ کامپوننتی لازم نیست خودش بارگذاری را صدا بزند.
   */
  watch(
    storageKey,
    key => {
      try {
        const raw = localStorage.getItem(key)

        levels.value = raw ? normalizeLevels(JSON.parse(raw)) : cloneLevels(DEFAULT_LEVELS)
      } catch {
        // داده خراب در حافظه نباید صفحه گزارش را بشکند.
        levels.value = cloneLevels(DEFAULT_LEVELS)
      }
    },
    { immediate: true },
  )

  // ایندکس صفر، روز بدون تسک است و از تم می‌آید.
  const colors = computed(() => [EMPTY_LEVEL_COLOR, ...levels.value.map(level => level.color)])

  // رنگ متنی که روی خود رنگ سطح می‌نشیند.
  const labelColors = computed(() => [
    EMPTY_LEVEL_LABEL_COLOR,
    ...levels.value.map(level => onColorOf(level.color)),
  ])

  // رنگ متنی که کنار رنگ سطح، روی پس‌زمینه صفحه می‌نشیند.
  const textColors = computed(() => [
    EMPTY_LEVEL_LABEL_COLOR,
    ...levels.value.map(level => textColorOf(level.color)),
  ])

  const bounds = computed(() =>
    levels.value.map((level, index) => ({ from: lowerBoundOf(levels.value, index), to: level.upTo })),
  )

  /*
   * رنگ‌های معنایی صفحه گزارش.
   *
   * کارت کار عقب‌افتاده، نقطه بینش، آیکون زنجیره و ستون قوی/ضعیف روزهای هفته
   * قبلاً رنگ ثابت داشتند و بیرون از سیستم بودند. حالا از دو سر همین پالت
   * می‌آیند، پس با تغییر پالت کاربر جا نمی‌مانند.
   */
  const accents = computed(() => {
    const list = levels.value

    return {
      worst: list[0].color,
      mid: list[Math.floor((list.length - 1) / 2)].color,
      best: list[list.length - 1].color,
    }
  })

  /*
   * متغیرهای CSS، تا استایل‌های scoped هم به همین رنگ‌ها برسند بدون آنکه هر
   * قاعده CSS به یک style درون‌خطی تبدیل شود.
   */
  const cssVars = computed(() => {
    const vars = {
      '--activity-worst': accents.value.worst,
      '--activity-mid': accents.value.mid,
      '--activity-best': accents.value.best,
      '--activity-level-0': EMPTY_LEVEL_COLOR,
    }

    levels.value.forEach((level, index) => {
      vars[`--activity-level-${index + 1}`] = level.color
    })

    return vars
  })

  /** سطح یک بازه، با دامنه‌های همین کاربر. */
  const getLevel = (total, done, isFuture = false) => levelOf(total, done, isFuture, levels.value)

  const colorFor = (total, done, isFuture = false) => colors.value[getLevel(total, done, isFuture)]

  /**
   * ذخیره پالت تازه. اگر ورودی سالم نباشد پیام خطا برمی‌گردد و چیزی عوض نمی‌شود.
   */
  function save(nextLevels) {
    const candidate = cloneLevels(nextLevels).map(level => ({
      color: level.color.trim().toLowerCase(),
      upTo: Number(level.upTo),
    }))

    const error = validateLevels(candidate)

    if (error) return error

    levels.value = candidate

    try {
      localStorage.setItem(storageKey.value, JSON.stringify(candidate))
    } catch {
      // حافظه پر یا مسدود. رنگ‌بندی در همین نشست کار می‌کند، ولی نمی‌ماند.
      return 'رنگ‌بندی اعمال شد ولی در این مرورگر ذخیره نشد.'
    }

    return ''
  }

  /** بازگشت به پالت پیش‌فرض و پاک کردن انتخاب کاربر. */
  function reset() {
    levels.value = cloneLevels(DEFAULT_LEVELS)

    try {
      localStorage.removeItem(storageKey.value)
    } catch {
      /* پاک نشدن کلید، رفتار همین نشست را عوض نمی‌کند. */
    }
  }

  // مقایسه بدون توجه به بزرگی حروف کد رنگ، چون هنگام ذخیره کوچک می‌شوند.
  const signatureOf = list =>
    list.map(level => `${level.color.toLowerCase()}:${level.upTo}`).join('|')

  const isDefault = computed(() => signatureOf(levels.value) === signatureOf(DEFAULT_LEVELS))

  return {
    levels,
    colors,
    labelColors,
    textColors,
    bounds,
    accents,
    cssVars,
    isDefault,
    getLevel,
    colorFor,
    save,
    reset,
  }
})
