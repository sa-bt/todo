<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ChevronDown, Check } from 'lucide-vue-next'

const props = defineProps({
  // ✅ v-model: مقدار انتخاب شده
  modelValue: { type: [String, Number, Boolean, Object, null], default: null },

  // ✅ آرایه گزینه‌ها (باید شامل {value, label} باشد)
  options: { type: Array, default: () => [] },

  // ✅ متن جایگزین
  placeholder: { type: String, default: 'انتخاب کنید' },

  // ✅ غیرفعال کردن
  disabled: { type: Boolean, default: false },

  // ✅ جهت قرارگیری منو (برای RTL 'right' بهتر است)
  align: { type: String, default: 'auto' }, // 'auto' | 'left' | 'right'

  // ✅ حداکثر ارتفاع منو
  maxHeight: { type: Number, default: 280 },

  // 💡 اضافه کردن Props برای لیبل و Name فیلد برای بهبود UX در فرم‌ها
  name: { type: String, required: true },
  label: { type: String, default: null },
})

const emit = defineEmits(['update:modelValue', 'open', 'close', 'change'])

const isOpen = ref(false)
const opener = ref(null)
const menu = ref(null)
const position = ref({ top: 0, left: 0, width: 0 })

// ✅ RTL/LTR detection
const dir = computed(() => getComputedStyle(document.documentElement).direction || 'rtl')
const current = computed(() => props.options.find(o => o.value === props.modelValue) || null)
const label = computed(() => current.value?.label ?? props.placeholder)

function open() {
  if (props.disabled) return
  isOpen.value = true
  emit('open')
  nextTick(reposition)
  attach()
}
function close() { if (!isOpen.value) return; isOpen.value = false; emit('close'); detach() }
function toggle(){ isOpen.value ? close() : open() }

function selectOption(opt){
  emit('update:modelValue', opt.value)
  emit('change', opt.value)
  close()
  // 💡 بازگرداندن فوکوس به دکمه پس از انتخاب
  opener.value?.focus()
}

function reposition(){
  const el = opener.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const vw = window.innerWidth
  const desiredWidth = rect.width
  let left = rect.left
  let top = rect.bottom + 4

  // منطق تراز: در RTL به صورت پیش‌فرض به راست تراز می‌شود.
  const align = props.align === 'auto' ? (dir.value === 'rtl' ? 'right' : 'left') : props.align
  if (align === 'right') left = Math.max(8, rect.right - desiredWidth)

  // جلوگیری از بیرون زدن منو از کناره‌های صفحه
  left = Math.min(Math.max(8, left), vw - desiredWidth - 8)

  position.value = { top, left, width: desiredWidth }
}

function onGlobalClick(e){
  if (!isOpen.value) return
  // مدیریت کلیک خارج از کامپوننت برای بستن منو
  const path = e.composedPath?.() || []
  if (!path.includes(opener.value) && !path.includes(menu.value)) close()
}
function onKey(e){
  if (!isOpen.value && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')){
    e.preventDefault(); open(); return
  }
  if (!isOpen.value) return
  if (e.key === 'Escape'){ e.preventDefault(); close(); return }

  // ✅ مدیریت ناوبری با کلیدهای جهتی
  const idx = props.options.findIndex(o => o.value === props.modelValue)
  if (e.key === 'ArrowDown'){ e.preventDefault();
    const next = props.options[Math.min(props.options.length-1, idx+1)] || props.options[0]
    emit('update:modelValue', next?.value)
  }
  if (e.key === 'ArrowUp'){ e.preventDefault();
    const prev = props.options[Math.max(0, idx-1)] || props.options[props.options.length-1]
    emit('update:modelValue', prev?.value)
  }
  if (e.key === 'Enter'){ e.preventDefault(); close() }
}

function attach(){
  window.addEventListener('scroll', reposition, true)
  window.addEventListener('resize', reposition)
  window.addEventListener('mousedown', onGlobalClick, true)
  window.addEventListener('keydown', onKey, true)
}
function detach(){
  window.removeEventListener('scroll', reposition, true)
  window.removeEventListener('resize', reposition)
  window.removeEventListener('mousedown', onGlobalClick, true)
  window.removeEventListener('keydown', onKey, true)
}

onMounted(()=> reposition())
onBeforeUnmount(()=> detach())

watch(isOpen, (v)=>{ if(v) nextTick(reposition) })
</script>

<template>
  <div class="relative w-full space-y-2">
    <label v-if="label" :for="name" class="block text-sm font-semibold text-[var(--color-heading)]">
      {{ label }}
    </label>

    <button
        ref="opener"
        :id="name"
        type="button"

        :class="[
            'w-full tap-target card-bg border border-token rounded-xl px-4 py-3 text-right inline-flex items-center justify-between transition text-sm font-medium ring-focus',
            {'opacity-70 cursor-not-allowed bg-[var(--color-background-soft)]': disabled}
        ]"
        :aria-expanded="isOpen ? 'true' : 'false'"
        :aria-haspopup="'listbox'"
        :disabled="disabled"
        @click="toggle"
    >
      <span :class="{'text-[var(--color-text-secondary)]': !current}">
        {{ label }}
      </span>
      <ChevronDown class="w-5 h-5 opacity-70" aria-hidden="true" />
    </button>

    <Teleport to="body">
      <transition name="fade-slide-y">
        <div
            v-show="isOpen"
            ref="menu"
            class="fixed z-[9999] mt-1 border border-token card-bg rounded-xl shadow-xl overflow-auto"
            :style="{ top: position.top + 'px', left: position.left + 'px', width: position.width + 'px', maxHeight: maxHeight + 'px' }"
            role="listbox"
        >
          <button
              v-for="opt in options"
              :key="String(opt.value) + '-' + String(opt.label)"

              class="w-full text-right px-4 py-2 flex items-center justify-between transition text-sm font-medium cursor-pointer tap-target"

              :aria-selected="opt.value === modelValue ? 'true' : 'false'"
              @click="selectOption(opt)"
              tabindex="-1"

              :class="{
                  // حالت انتخاب شده
                  'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold': opt.value === modelValue,
                  // حالت هاور (سفارشی برای کنتراست)
                  'hover:bg-[var(--color-background-soft-hover)]': opt.value !== modelValue,
              }"
          >
            <span class="truncate">{{ opt.label }}</span>
            <Check v-if="opt.value === modelValue" class="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* کلاس‌های کمکی برای transitionهای ساده */
.fade-slide-y-enter-active, .fade-slide-y-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-y-enter-from, .fade-slide-y-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* اسکرول‌بار نرم (بهتر است به صورت سراسری در CSS تعریف شود، اما اینجا برای کامل بودن آورده می‌شود) */
.fixed::-webkit-scrollbar{ width:8px; height:8px }
.fixed::-webkit-scrollbar-thumb{
  background: color-mix(in oklab, var(--color-border) 60%, var(--color-text) 40%);
  border-radius: 8px;
}
</style>
