<script setup>
import { ref, watch, computed } from "vue"

const props = defineProps({
  show: Boolean,
  editingGoal: Object,
  priorities: Array,
  statuses: Array,
  goals: Array
})

const emit = defineEmits(["close", "save"])

// فرم داخلی
const title = ref("")
const description = ref("")
const priority = ref("medium")
const status = ref("pending")
const parentId = ref(null)

watch(
  () => props.editingGoal,
  goal => {
    if (goal) {
      title.value = goal.title
      description.value = goal.description
      priority.value = goal.priority
      status.value = goal.status
      parentId.value = goal.parent_id
    } else {
      title.value = ""
      description.value = ""
      priority.value = "medium"
      status.value = "pending"
      parentId.value = null
    }
  },
  { immediate: true }
)

// والد انتخاب شده
const parentTitle = computed(() => {
  if (!parentId.value) return "بدون والد"
  const parent = props.goals.find(g => g.id === parentId.value)
  return parent ? parent.title : "نامشخص"
})

function save() {
  emit("save", {
    title: title.value,
    description: description.value,
    priority: priority.value,
    status: status.value,
    parent_id: parentId.value,
  })
}
</script>

<template>
  <transition name="fade-scale">
    <div
      v-if="show"
      class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
    >
      <div
        class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl transform transition-all duration-300"
      >
        <h2 class="text-lg font-bold mb-4 text-right">
          {{ editingGoal ? "ویرایش هدف" : "افزودن هدف" }}
        </h2>

        <input
          v-model="title"
          type="text"
          placeholder="عنوان هدف..."
          class="w-full p-3 rounded-lg border mb-3 text-right focus:ring-2 focus:ring-blue-400"
        />

        <textarea
          v-model="description"
          rows="2"
          placeholder="توضیحات هدف..."
          class="w-full p-3 rounded-lg border mb-3 text-right focus:ring-2 focus:ring-blue-400"
        ></textarea>

        <!-- انتخاب والد -->
        <select
          v-model="parentId"
          class="w-full p-3 rounded-lg border mb-2 text-right bg-gray-50"
        >
          <option :value="null">بدون والد</option>
          <option
            v-for="g in goals"
            :key="g.id"
            :value="g.id"
          >
            {{ g.title }}
          </option>
        </select>
        <div class="text-xs text-gray-500 mb-3 text-right">
          والد انتخاب شده: 
          <span class="font-semibold text-indigo-600">{{ parentTitle }}</span>
        </div>

        <!-- انتخاب اولویت -->
        <select
          v-model="priority"
          class="w-full p-3 rounded-lg border mb-3 text-right bg-gray-50"
        >
          <option
            v-for="p in priorities"
            :key="p.value"
            :value="p.value"
            :class="{
              'text-red-600': p.value === 'high',
              'text-yellow-500': p.value === 'medium',
              'text-green-500': p.value === 'low',
            }"
          >
            ● {{ p.label }}
          </option>
        </select>

        <!-- انتخاب وضعیت -->
        <select
          v-model="status"
          class="w-full p-3 rounded-lg border mb-3 text-right bg-gray-50"
        >
          <option
            v-for="s in statuses"
            :key="s.value"
            :value="s.value"
            :class="{
              'text-green-600': s.value === 'completed',
              'text-blue-500': s.value === 'in_progress',
              'text-gray-500': s.value === 'pending'
            }"
          >
            {{ s.label }}
          </option>
        </select>

        <div class="flex justify-end gap-2 mt-4">
          <button
            @click="emit('close')"
            class="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg transition"
          >
            انصراف
          </button>
          <button
            @click="save"
            class="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg shadow hover:opacity-90 transition"
          >
            ذخیره
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.2s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
