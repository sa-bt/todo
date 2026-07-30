<template>
  <section class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]" dir="rtl">
    <form
      class="space-y-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-sm"
      @submit.prevent="openConfirmation"
    >
      <div>
        <p class="text-xs font-bold text-[var(--color-primary)]">پیام تازه</p>
        <h2 class="mt-1 text-xl font-black text-[var(--color-heading)]">ساخت اعلان</h2>
      </div>

      <label class="block space-y-2">
        <span class="text-sm font-bold">عنوان</span>
        <input
          v-model.trim="form.title"
          required
          maxlength="120"
          class="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none"
          placeholder="عنوان کوتاه و روشن"
        />
      </label>
      <label class="block space-y-2">
        <span class="text-sm font-bold">متن اعلان</span>
        <textarea
          v-model.trim="form.body"
          required
          maxlength="1000"
          rows="5"
          class="w-full rounded-xl border border-[var(--color-border)] bg-transparent p-3 text-sm leading-7 outline-none"
          placeholder="پیامی که کاربر دریافت می‌کند..."
        />
      </label>
      <label class="block space-y-2">
        <span class="text-sm font-bold">مسیر پس از کلیک</span>
        <input
          v-model.trim="form.url"
          dir="ltr"
          class="min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-transparent px-3 text-left text-sm outline-none"
          placeholder="/app/goals"
        />
        <span class="text-xs text-[var(--color-text-secondary)]"
          >فقط مسیر داخلی برنامه پذیرفته می‌شود.</span
        >
      </label>

      <div class="grid gap-3 sm:grid-cols-2">
        <label
          v-for="channel in channels"
          :key="channel.value"
          class="flex cursor-pointer gap-3 rounded-xl border p-4"
          :class="
            form.channel === channel.value
              ? 'border-[var(--color-primary)] bg-[var(--color-background-soft)]'
              : 'border-[var(--color-border)]'
          "
        >
          <input v-model="form.channel" type="radio" :value="channel.value" class="mt-1" />
          <span
            ><strong class="block text-sm">{{ channel.label }}</strong
            ><span class="mt-1 block text-xs leading-6 text-[var(--color-text-secondary)]">{{
              channel.description
            }}</span></span
          >
        </label>
      </div>

      <div class="space-y-3">
        <span class="text-sm font-bold">مخاطبان</span>
        <div class="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            class="min-h-11 rounded-xl border text-sm font-bold"
            :class="
              form.audience === 'selected'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                : 'border-[var(--color-border)]'
            "
            @click="form.audience = 'selected'"
          >
            کاربران انتخابی
          </button>
          <button
            type="button"
            class="min-h-11 rounded-xl border text-sm font-bold"
            :class="
              form.audience === 'all'
                ? 'border-amber-500 bg-amber-500 text-slate-950'
                : 'border-[var(--color-border)]'
            "
            @click="form.audience = 'all'"
          >
            همه کاربران
          </button>
        </div>
      </div>

      <div v-if="form.audience === 'selected'" class="space-y-3">
        <label
          class="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--color-border)] px-3"
        >
          <Search class="h-4 w-4 text-[var(--color-text-secondary)]" />
          <input
            v-model.trim="userSearch"
            type="search"
            class="min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder="جست‌وجوی نام یا ایمیل..."
            @input="searchUsers"
          />
        </label>
        <div
          v-if="userResults.length"
          class="max-h-52 overflow-y-auto rounded-xl border border-[var(--color-border)]"
        >
          <button
            v-for="user in userResults"
            :key="user.id"
            type="button"
            class="flex w-full items-center justify-between border-b border-[var(--color-border)] p-3 text-right text-sm last:border-0 hover:bg-[var(--color-background-soft)]"
            @click="selectUser(user)"
          >
            <span
              ><strong class="block">{{ user.name }}</strong
              ><span class="text-xs text-[var(--color-text-secondary)]" dir="ltr">{{
                user.email
              }}</span></span
            ><Plus class="h-4 w-4 text-[var(--color-primary)]" />
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="user in selectedUsers"
            :key="user.id"
            class="inline-flex items-center gap-2 rounded-full bg-[var(--color-background-soft)] px-3 py-2 text-xs font-bold"
          >
            {{ user.name
            }}<button type="button" @click="removeUser(user.id)"><X class="h-3.5 w-3.5" /></button>
          </span>
        </div>
      </div>

      <p v-if="errorMessage" class="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-600">
        {{ errorMessage }}
      </p>
      <p v-if="successMessage" class="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-700">
        {{ successMessage }}
      </p>
      <button
        type="submit"
        class="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] font-black text-white"
        :disabled="sending"
      >
        <Send class="h-4 w-4" />بررسی و ارسال
      </button>
    </form>

    <div class="space-y-6">
      <section
        class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-sm"
      >
        <p class="text-xs font-bold text-[var(--color-primary)]">پیش‌نمایش</p>
        <div class="mt-4 rounded-2xl bg-slate-950 p-4 text-white shadow-xl">
          <div class="flex gap-3">
            <span
              class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400 text-slate-950"
              ><BellRing class="h-5 w-5"
            /></span>
            <div>
              <strong class="text-sm">{{ form.title || 'عنوان اعلان' }}</strong>
              <p class="mt-1 text-xs leading-6 text-slate-300">
                {{ form.body || 'متن اعلان در اینجا نمایش داده می‌شود.' }}
              </p>
            </div>
          </div>
        </div>
      </section>
      <section
        class="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm"
      >
        <h3 class="border-b border-[var(--color-border)] p-4 font-black">ارسال‌های اخیر</h3>
        <p v-if="historyLoading" class="p-8 text-center text-sm text-[var(--color-text-secondary)]">
          در حال دریافت سابقه...
        </p>
        <p
          v-else-if="!campaigns.length"
          class="p-8 text-center text-sm text-[var(--color-text-secondary)]"
        >
          هنوز اعلانی ارسال نشده است.
        </p>
        <ul v-else class="divide-y divide-[var(--color-border)]">
          <li v-for="campaign in campaigns" :key="campaign.id" class="p-4">
            <div class="flex justify-between gap-3">
              <strong class="text-sm">{{ campaign.title }}</strong
              ><span class="shrink-0 text-xs text-[var(--color-text-secondary)]"
                >{{ Number(campaign.recipient_count).toLocaleString('fa-IR') }} مخاطب</span
              >
            </div>
            <p class="mt-2 line-clamp-2 text-xs leading-6 text-[var(--color-text-secondary)]">
              {{ campaign.body }}
            </p>
          </li>
        </ul>
      </section>
    </div>

    <Teleport to="body"
      ><div
        v-if="confirming"
        class="fixed inset-0 z-[90] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"
        dir="rtl"
        @click.self="confirming = false"
      >
        <div class="w-full max-w-md rounded-3xl bg-[var(--color-background)] p-6 shadow-2xl">
          <TriangleAlert class="h-10 w-10 text-amber-600" />
          <h3 class="mt-4 text-lg font-black">ارسال اعلان تأیید شود؟</h3>
          <p class="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">
            این پیام برای {{ audienceDescription }} در صف ارسال قرار می‌گیرد.
          </p>
          <div class="mt-6 flex gap-2">
            <button
              type="button"
              class="min-h-11 flex-1 rounded-xl border border-[var(--color-border)] font-bold"
              @click="confirming = false"
            >
              بازگشت</button
            ><button
              type="button"
              class="min-h-11 flex-1 rounded-xl bg-[var(--color-primary)] font-bold text-white"
              @click="sendNotification"
            >
              تأیید ارسال
            </button>
          </div>
        </div>
      </div></Teleport
    >
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { BellRing, Plus, Search, Send, TriangleAlert, X } from 'lucide-vue-next'
import { getAdminNotificationCampaigns, getAdminUsers, sendAdminNotification } from '@/plugins/api'

const form = reactive({ title: '', body: '', url: '', channel: 'database', audience: 'selected' })
const selectedUsers = ref([])
const userResults = ref([])
const userSearch = ref('')
const campaigns = ref([])
const confirming = ref(false)
const sending = ref(false)
const historyLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
let searchTimer
const channels = [
  { value: 'database', label: 'درون‌برنامه‌ای', description: 'در صندوق اعلان کاربر ذخیره می‌شود.' },
  { value: 'webpush', label: 'همراه اعلان مرورگر', description: 'اعلان مرورگر نیز ارسال می‌شود.' },
]
const audienceDescription = computed(() =>
  form.audience === 'all'
    ? 'همه کاربران سامانه'
    : `${selectedUsers.value.length.toLocaleString('fa-IR')} کاربر انتخابی`,
)

function searchUsers() {
  clearTimeout(searchTimer)
  if (userSearch.value.length < 2) return (userResults.value = [])
  searchTimer = setTimeout(async () => {
    const response = await getAdminUsers({ search: userSearch.value, per_page: 10 })
    userResults.value = (response?.data?.data ?? []).filter(
      (user) => !selectedUsers.value.some((selected) => selected.id === user.id),
    )
  }, 300)
}
function selectUser(user) {
  if (!selectedUsers.value.some((selected) => selected.id === user.id))
    selectedUsers.value.push(user)
  userResults.value = userResults.value.filter((item) => item.id !== user.id)
}
function removeUser(id) {
  selectedUsers.value = selectedUsers.value.filter((user) => user.id !== id)
}
function openConfirmation() {
  errorMessage.value = ''
  successMessage.value = ''
  if (form.audience === 'selected' && !selectedUsers.value.length)
    return (errorMessage.value = 'حداقل یک کاربر را انتخاب کنید.')
  if (form.url && !/^\/(?!\/)\S*$/.test(form.url))
    return (errorMessage.value = 'مسیر مقصد باید داخلی باشد.')
  confirming.value = true
}
async function loadCampaigns() {
  historyLoading.value = true
  try {
    const response = await getAdminNotificationCampaigns()
    campaigns.value = response?.data?.data ?? []
  } finally {
    historyLoading.value = false
  }
}
async function sendNotification() {
  sending.value = true
  try {
    const response = await sendAdminNotification({
      ...form,
      url: form.url || null,
      user_ids:
        form.audience === 'selected' ? selectedUsers.value.map((user) => user.id) : undefined,
    })
    confirming.value = false
    successMessage.value = response?.message || 'اعلان در صف قرار گرفت.'
    form.title = ''
    form.body = ''
    form.url = ''
    selectedUsers.value = []
    await loadCampaigns()
  } catch (error) {
    confirming.value = false
    errorMessage.value = error?.response?.data?.message || 'ارسال اعلان انجام نشد.'
  } finally {
    sending.value = false
  }
}
onMounted(loadCampaigns)
</script>
