import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAdminUsers } from '@/plugins/api'

/**
 * Number of accounts waiting for an administrator decision.
 *
 * Shared between the panel navigation badge and the users screen so a decision
 * taken on one immediately settles the other. The count is read from the
 * paginator total with a one-row page, so it stays cheap to refresh.
 */
export const useAdminPendingUsersStore = defineStore('adminPendingUsers', () => {
  const count = ref(0)

  async function refresh() {
    try {
      const response = await getAdminUsers({ status: 'pending', per_page: 1 })
      count.value = Number(response?.data?.total ?? 0)
    } catch {
      // A failed badge refresh must never break the screen that asked for it.
    }
  }

  return { count, refresh }
})
