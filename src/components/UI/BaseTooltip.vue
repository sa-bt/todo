<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

const props = defineProps({
  /** متن ساده؛ اگر اسلات default بدهی، متن نادیده گرفته می‌شود */
  text: { type: String, default: '' },

  /** جایگاه: top | bottom | left | right | auto */
  placement: { type: String, default: 'auto' },

  /** نحوه باز شدن: hover | click | manual (برای v-model) */
  trigger: { type: String, default: 'hover' },

  /** برای manual: کنترل بیرونی */
  modelValue: { type: Boolean, default: false },

  /** فاصله از تریگر (px) */
  offset: { type: Number, default: 8 },

  /** تاخیر نمایش/مخفی (ms) */
  delay: { type: Number, default: 0 },

  /** بیشینه عرض */
  maxWidth: { type: Number, default: 240 },

  /** z-index لایهٔ تولتیپ */
  zIndex: { type: Number, default: 9999 },

  /** غیرفعال */
  disabled: { type: Boolean, default: false },

  /** کلاس‌های اضافی برای جعبه تولتیپ */
  contentClass: { type: String, default: '' },

  /** نمایش فلش مثلثی */
  arrow: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'open', 'close'])

const open = ref(false)
const hovering = ref(false)
const opener = ref(null)     // تریگر
const floating = ref(null)   // جعبه تولتیپ
const arrowEl = ref(null)

let openTimer = null
let closeTimer = null

const isManual = computed(()=> props.trigger === 'manual')
const visible = computed(() => isManual.value ? props.modelValue : open.value)

/* id برای aria-describedby */
const tipId = `tip-${Math.random().toString(36).slice(2,9)}`

function setOpen(v){
  if (props.disabled) return
  if (isManual.value){
    emit('update:modelValue', v)
  } else {
    open.value = v
  }
  v ? emit('open') : emit('close')
  nextTick(position)
}

function scheduleOpen(){
  if (openTimer) clearTimeout(openTimer)
  if (closeTimer) clearTimeout(closeTimer)
  openTimer = setTimeout(()=> setOpen(true), props.delay)
}
function scheduleClose(){
  if (openTimer) clearTimeout(openTimer)
  if (closeTimer) clearTimeout(closeTimer)
  // کمی تاخیر برای تجربه بهتر hover
  closeTimer = setTimeout(()=> setOpen(false), Math.max(80, props.delay/2))
}

/* برخورد با لبه‌ها + RTL آگاه */
function position(){
  const triggerEl = opener.value
  const tipEl = floating.value
  if (!triggerEl || !tipEl || !visible.value) return

  // fixed + viewport coords
  const r = triggerEl.getBoundingClientRect()
  const tipRect = tipEl.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const dir = getComputedStyle(document.documentElement).direction || 'rtl'
  const gap = props.offset

  // اگر auto: اولویت بالا→پایین→راست→چپ
  const order = props.placement === 'auto'
      ? ['top','bottom','right','left']
      : [props.placement]

  let top = 0, left = 0, used = order[0]

  function place(p){
    if (p === 'top'){
      top  = r.top - tipRect.height - gap
      left = r.left + (r.width/2) - (tipRect.width/2)
    }
    else if (p === 'bottom'){
      top  = r.bottom + gap
      left = r.left + (r.width/2) - (tipRect.width/2)
    }
    else if (p === 'right'){
      top  = r.top + (r.height/2) - (tipRect.height/2)
      left = r.right + gap
    }
    else if (p === 'left'){
      top  = r.top + (r.height/2) - (tipRect.height/2)
      left = r.left - tipRect.width - gap
    }
  }

  // انتخاب موقعیت قابل‌قبول
  for (const p of order){
    place(p)
    const fits = top >= 4 && (top + tipRect.height <= vh - 4) &&
        left >= 4 && (left + tipRect.width <= vw - 4)
    if (fits){ used = p; break }
  }
  // کلمپ نهایی
  top  = Math.max(4, Math.min(top, vh - tipRect.height - 4))
  left = Math.max(4, Math.min(left, vw - tipRect.width - 4))

  tipEl.style.top  = `${top}px`
  tipEl.style.left = `${left}px`

  // فلش
  if (props.arrow && arrowEl.value){
    const a = arrowEl.value
    a.setAttribute('data-side', used)
  }

  // جهت متن داخل تولتیپ مطابق صفحه
  tipEl.dir = dir
}

/* لیسنرها */
function onGlobalScroll(){ if (visible.value) position() }
function onResize(){ if (visible.value) position() }
function onDocClick(e){
  if (!visible.value) return
  const path = e.composedPath?.() || []
  if (!path.includes(opener.value) && !path.includes(floating.value)){
    setOpen(false)
  }
}

onMounted(()=>{
  window.addEventListener('scroll', onGlobalScroll, true)
  window.addEventListener('resize', onResize)
  document.addEventListener('mousedown', onDocClick, true)
})
onBeforeUnmount(()=>{
  window.removeEventListener('scroll', onGlobalScroll, true)
  window.removeEventListener('resize', onResize)
  document.removeEventListener('mousedown', onDocClick, true)
})

/* واکنش به v-model در حالت manual */
watch(()=> props.modelValue, (v)=>{
  if (isManual.value){
    nextTick(position)
  }
})

/* رویدادهای تریگر بر اساس mode */
function onEnter(){
  if (props.trigger !== 'hover') return
  hovering.value = true
  scheduleOpen()
}
function onLeave(){
  if (props.trigger !== 'hover') return
  hovering.value = false
  scheduleClose()
}
function onClick(){
  if (props.trigger !== 'click') return
  setOpen(!visible.value)
}
function onKey(e){
  if (e.key === 'Escape' && visible.value) setOpen(false)
}

</script>

<template>
  <!-- رَپر تریگر -->
  <span
      ref="opener"
      class="inline-flex items-center justify-center align-middle"
      :aria-describedby="visible ? tipId : undefined"
      :aria-expanded="visible ? 'true' : 'false'"
      @mouseenter="onEnter" @mouseleave="onLeave"
      @click="onClick" @keydown="onKey"
  >
    <slot />
  </span>

  <!-- محتوا: Teleport به body تا هرگز گوشهٔ صفحه نچسبد -->
  <Teleport to="body">
    <div
        v-show="visible"
        ref="floating"
        :id="tipId"
        class="fixed pointer-events-none select-none tooltip-surface"
        :style="{ maxWidth: maxWidth + 'px', zIndex: zIndex }"
        role="tooltip"
    >
      <div
          class="tooltip-box"
          :class="contentClass"
      >
        <slot name="content">
          {{ text }}
        </slot>
        <div v-if="arrow" ref="arrowEl" class="tooltip-arrow" />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* سطح کلی تولتیپ */
.tooltip-surface{
  /* ترنزیشن ورود/خروج */
  opacity: 0;
  transform: translateY(-3px);
  transition: opacity .12s ease, transform .12s ease;
}
.tooltip-surface[style]{
  /* وقتی v-show=true و پوزیشن اعمال شده، بلافاصله قابل‌دیدن */
  opacity: 1;
  transform: translateY(0);
}

/* جعبه داخلی */
.tooltip-box{
  background: #fff;
  color: var(--color-heading);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 8px 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,.08);
  font-size: 12px;
  line-height: 1.4;
}

/* فلش */
.tooltip-arrow{
  width: 10px; height: 10px;
  position: absolute;
  background: #fff;
  border-left: 1px solid var(--color-border);
  border-top: 1px solid var(--color-border);
  transform: rotate(45deg);
}
/* جای فلش نسبت به جهت */
.tooltip-arrow[data-side="top"]{
  bottom: -5px; left: 50%; transform: translateX(-50%) rotate(45deg);
  border-left: 1px solid var(--color-border); border-top: 1px solid var(--color-border);
}
.tooltip-arrow[data-side="bottom"]{
  top: -5px; left: 50%; transform: translateX(-50%) rotate(45deg);
  border-right: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border);
}
.tooltip-arrow[data-side="left"]{
  right: -5px; top: 50%; transform: translateY(-50%) rotate(45deg);
  border-top: 1px solid var(--color-border); border-right: 1px solid var(--color-border);
}
.tooltip-arrow[data-side="right"]{
  left: -5px; top: 50%; transform: translateY(-50%) rotate(45deg);
  border-left: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border);
}

/* احترام به کاهش حرکت */
@media (prefers-reduced-motion: reduce){
  .tooltip-surface{ transition-duration: .01ms !important; }
}
</style>
