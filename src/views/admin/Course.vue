<template>
  <div class="p-6 bg-[var(--color-background-soft)] min-h-full" dir="rtl">
    <div class="max-w-7xl mx-auto bg-[var(--color-background)] p-8 rounded-2xl shadow-xl border border-[var(--color-border)]">
      
      <h1 class="text-3xl font-extrabold text-[var(--color-heading)] mb-6">
        دوره: {{ courseTitle }}
      </h1>
      
      <div v-if="loading" class="text-center py-20 text-[var(--color-text-secondary)]">
        <svg class="w-12 h-12 animate-spin text-[var(--color-primary)] mx-auto" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-4">در حال بارگذاری محتوای دوره...</p>
      </div>

      <div v-else-if="error" class="text-center py-20 text-red-500">
        <p class="text-2xl font-semibold mb-2">خطا در بارگذاری</p>
        <p>متأسفانه بارگذاری دوره با مشکل مواجه شد: {{ error }}</p>
      </div>
      
      <div v-else class="course-content flex flex-col lg:flex-row gap-8">
        
        <div class="lg:w-1/4 flex-shrink-0 lg:border-l lg:pl-6 border-[var(--color-border)]">
            <h2 class="text-xl font-semibold text-[var(--color-heading)] mb-4">سرفصل‌های دوره</h2>
            <div class="space-y-2">
                <button
                    v-for="(chapter, index) in chapters"
                    :key="chapter.slug"
                    @click="currentChapterIndex = index; currentStep = 0;"
                    class="w-full text-right p-3 rounded-lg transition text-sm focus:outline-none"
                    :class="[
                        index === currentChapterIndex 
                            ? 'bg-[var(--color-secondary)] text-white font-medium shadow-md' 
                            : 'bg-[var(--color-background-mute)] hover:bg-[var(--color-border)] text-[var(--color-text)]'
                    ]"
                >
                    <span class="font-bold mr-2">{{ index + 1 }}.</span> {{ chapter.title }}
                </button>
            </div>
        </div>
        
        <div class="lg:w-3/4">
            
            <h2 class="text-2xl font-extrabold text-[var(--color-primary)] mb-6">
                {{ currentChapterIndex + 1 }}. {{ chapters[currentChapterIndex]?.title }}
            </h2>

            <div v-if="isVisualMode" class="flex flex-col gap-8">
                
                <h3 class="text-xl font-semibold text-[var(--color-heading)] border-b pb-2">فرآیند بصری: گام به گام</h3>

                <div class="space-y-3">
                    <button
                        v-for="(step, index) in steps"
                        :key="index"
                        @click="currentStep = index"
                        class="w-full text-right p-3 rounded-xl transition flex items-start gap-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
                        :class="[
                            index === currentStep 
                            ? 'bg-[var(--color-primary)] text-white shadow-md' 
                            : 'bg-[var(--color-background-mute)] hover:bg-[var(--color-border)] text-[var(--color-heading)]'
                        ]"
                    >
                        <span class="text-lg font-bold">{{ index + 1 }}</span>
                        <div class="flex flex-col items-start">
                            <span class="font-medium">{{ step.title }}</span>
                            <span v-if="index === currentStep" class="text-sm opacity-80 mt-0.5">
                            {{ step.description }}
                            </span>
                        </div>
                    </button>
                </div>
                
                <div class="relative overflow-x-auto p-4 rounded-xl border-2 border-[var(--color-primary)]/50 bg-gray-50 dark:bg-gray-900/50 min-h-[400px]">
                    <svg class="w-full h-full" viewBox="0 0 700 360" style="min-width: 600px;">
                        <defs>
                            <marker id="arrowhead" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                            <path d="M 0 0 L 10 5 L 0 10 z" :fill="colors.branch" />
                            </marker>
                            <marker id="arrowheadStash" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                            <path d="M 0 0 L 10 5 L 0 10 z" :fill="colors.stash" />
                            </marker>
                        </defs>
                        <line x1="50" y1="80" x2="650" y2="80" :stroke="colors.branch" stroke-width="2" marker-end="url(#arrowhead)" />
                        <text x="50" y="60" :fill="colors.branch" font-weight="bold">Branch: main</text>
                        <circle cx="150" cy="80" r="15" :fill="colors.commit" stroke="white" stroke-width="2" />
                        <text x="150" y="110" text-anchor="middle" :fill="colors.commit">C1</text>
                        <circle cx="350" cy="80" r="15" :fill="colors.commit" stroke="white" stroke-width="2" />
                        <text x="350" y="110" text-anchor="middle" :fill="colors.commit">C2</text>
                        <rect x="330" y="130" width="40" height="20" rx="5" :fill="colors.branch" />
                        <text x="350" y="145" font-size="12" text-anchor="middle" fill="white">HEAD</text>
                        <rect x="50" y="250" width="600" height="100" rx="10" :stroke="colors.worktree" stroke-dasharray="5,5" stroke-width="2" fill="none" />
                        <text x="350" y="275" text-anchor="middle" :fill="colors.worktree" font-weight="bold">Work Tree / Staging Area</text>
                        <text x="350" y="320" text-anchor="middle" font-size="14" :fill="colors.text">{{ workTreeContent }}</text>
                        <g :opacity="stashVisible ? 1 : 0" :transform="`translate(500, -20)`" class="transition-opacity duration-700">
                            <rect x="50" y="20" width="100" height="40" rx="5" :fill="colors.stash" stroke="white" stroke-width="2" />
                            <text x="100" y="45" text-anchor="middle" fill="white" font-size="14">stash@{0}</text>
                        </g>
                        
                        <g :opacity="currentStep === 1 ? 1 : 0" class="transition-opacity duration-700">
                            <text x="350" y="230" text-anchor="middle" :fill="colors.worktree" font-weight="bold">Uncommitted Changes Ready!</text>
                        </g>
                        <g :opacity="currentStep === 2 ? 1 : 0" class="transition-opacity duration-700">
                            <text x="400" y="180" :fill="colors.stash" font-weight="bold">git stash</text>
                            <line x1="350" y1="280" x2="350" y2="180" :stroke="colors.stash" stroke-width="3" />
                            <line x1="350" y1="180" x2="500" y2="180" :stroke="colors.stash" stroke-width="3" />
                            <line x1="500" y1="180" x2="550" y2="40" :stroke="colors.stash" stroke-width="3" marker-end="url(#arrowheadStash)" />
                        </g>
                        <g :opacity="currentStep === 3 ? 1 : 0" class="transition-opacity duration-700">
                            <text x="350" y="230" text-anchor="middle" fill="green" font-weight="bold">Work Tree is Clean!</text>
                        </g>
                        <g :opacity="currentStep === 4 ? 1 : 0" class="transition-opacity duration-700">
                            <text x="400" y="180" :fill="colors.stash" font-weight="bold">git stash apply/pop</text>
                            <line x1="550" y1="40" x2="500" y2="180" :stroke="colors.stash" stroke-width="3" />
                            <line x1="500" y1="180" x2="350" y2="180" :stroke="colors.stash" stroke-width="3" />
                            <line x1="350" y1="180" x2="350" y2="280" :stroke="colors.stash" stroke-width="3" marker-end="url(#arrowheadStash)" />
                        </g>
                    </svg>
                    </div>

            </div>

            <div v-else class="space-y-8 py-4">
                <div v-for="(block, index) in currentChapterContent" :key="index">
                    <h2 v-if="block.type === 'heading'" 
                        :class="[
                            block.level == 2 ? 'text-2xl font-bold mt-8 mb-4 border-b pb-2 text-[var(--color-primary)]' :
                            block.level == 3 ? 'text-xl font-semibold mt-6 mb-3 text-[var(--color-heading)]' :
                            'text-lg font-medium mt-4 mb-2 text-[var(--color-text)]'
                        ]">
                        {{ block.text }}
                    </h2>

                    <p v-else-if="block.type === 'paragraph'" class="text-[var(--color-text)] leading-relaxed mb-4">
                        {{ block.text }}
                    </p>

                    <pre v-else-if="block.type === 'code'" class="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-sm mb-4 border border-[var(--color-border)]">
                        <code :class="`language-${block.language || 'text'}`">{{ block.code }}</code>
                    </pre>
                    
                    <blockquote v-else-if="block.type === 'note'" 
                        :class="[
                            'p-4 rounded-lg border-r-4 mb-4',
                            block.style === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-400 dark:text-yellow-300' :
                            'bg-blue-50 border-blue-500 text-blue-800 dark:bg-blue-900/20 dark:border-blue-400 dark:text-blue-300'
                        ]">
                        <p class="font-medium">
                            {{ block.style === 'warning' ? '⚠️ اخطار:' : '💡 نکته:' }} 
                            <span class="font-normal">{{ block.text }}</span>
                        </p>
                    </blockquote>

                    <component v-else-if="block.type === 'list'" 
                        :is="block.ordered ? 'ol' : 'ul'" 
                        :class="[
                            'space-y-2 mb-4 pl-8 text-[var(--color-text)]',
                            block.ordered ? 'list-decimal' : 'list-disc'
                        ]">
                        <li v-for="(item, itemIndex) in block.items" :key="itemIndex">
                            {{ item }}
                        </li>
                    </component>

                    <div v-else-if="block.type === 'image'" class="my-6">
                        <img :src="block.url" :alt="block.alt" class="rounded-lg shadow-md w-full h-auto object-cover border border-[var(--color-border)]" />
                        <p v-if="block.alt" class="text-center text-sm text-[var(--color-text-secondary)] mt-2 italic">{{ block.alt }}</p>
                    </div>

                    <div v-else class="p-3 bg-red-100 text-red-700 rounded-lg">
                        خطا: نوع بلاک نامعتبر ({{ block.type }})
                    </div>
                </div>
            </div>
        </div>
        
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getCourseData } from '@/plugins/api';

const route = useRoute();

const currentStep = ref(0);
const loading = ref(true);
const error = ref(null);
const courseTitle = ref('در حال بارگذاری...');

const chapters = ref([]); 
const currentChapterIndex = ref(0); // شروع از سرفصل اول

// داده‌های داینامیک SVG: مقادیر پیش‌فرض
const colors = ref({
    commit: '#3b82f6', 
    branch: '#f97316', 
    stash: '#10b981',  
    worktree: '#ef4444', 
    text: 'var(--color-text)'
});

// 💡 مراحل بصری (steps) از فصل جاری استخراج می‌شوند
const steps = computed(() => {
    if (!chapters.value.length) return [];
    return chapters.value[currentChapterIndex.value]?.steps || [];
});

/**
 * واکشی داده‌های دوره بر اساس slug
 */
async function fetchCourseData() {
    const courseSlug = route.params.slug;
    if (!courseSlug) {
        error.value = 'شناسه دوره (slug) در آدرس وجود ندارد.';
        loading.value = false;
        return;
    }

    loading.value = true;
    error.value = null;
    try {
        const data = await getCourseData(courseSlug); 
        
        if (data.title) courseTitle.value = data.title;
        
        if (data.colors) colors.value = data.colors;
        
        if (data.chapters && Array.isArray(data.chapters)) {
            chapters.value = data.chapters;
        } else {
            chapters.value = [];
        }

    } catch (e) {
        console.error("Failed to load course data:", e);
        error.value = e.message || 'خطا در شبکه یا سرور';
        courseTitle.value = 'خطا در بارگذاری';
    } finally {
        loading.value = false;
        // مطمئن می‌شویم که روی اولین سرفصل هستیم
        if (chapters.value.length > 0) currentChapterIndex.value = 0;
    }
}

onMounted(fetchCourseData);

// **********************************
// *** Computed Properties for Content/SVG ***
// **********************************

// محتوای متنی/ساختاریافته فصل فعلی
const currentChapterContent = computed(() => {
    if (!chapters.value.length) return [];
    // محتوای مربوط به سرفصل انتخابی را برمی‌گرداند
    return chapters.value[currentChapterIndex.value]?.content || [];
});

// تعیین حالت رندر: اگر فصل فعلی دارای آرایه steps باشد، حالت بصری فعال است.
const isVisualMode = computed(() => {
    // از computed steps استفاده می‌کند
    return steps.value.length > 0;
});

// محتوای داینامیک Work Tree در SVG
const workTreeContent = computed(() => {
    if (!steps.value.length) return '—';
    const stepIndex = currentStep.value;
    return steps.value[stepIndex]?.workTree || '—';
});

// قابلیت دید Stash Stack در SVG
const stashVisible = computed(() => {
    if (!steps.value.length) return false;
    const stepIndex = currentStep.value;
    return steps.value[stepIndex]?.stash || false;
});
</script>

<style scoped>
/* استایل‌های SVG و Code Block */
.transition-opacity {
  transition: opacity 0.7s ease-in-out;
}
pre code {
    font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
    line-height: 1.5;
}
</style>