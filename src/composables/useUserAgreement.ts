import { ref, computed } from 'vue'
import { api } from '@/api/client'

const USER_AGREEMENT_KEY = 'euoracraft_user_agreement_accepted'
const USER_AGREEMENT_URL = 'https://euoracraft.zient.top/guide/user-agreement/'

interface UserAgreementState {
  accepted: boolean
  loading: boolean
}

const state = ref<UserAgreementState>({
  accepted: false,
  loading: true
})

export async function checkUserAgreement(): Promise<boolean> {
  state.value.loading = true
  try {
    const localAccepted = localStorage.getItem(USER_AGREEMENT_KEY) === 'true'
    if (localAccepted) {
      state.value.accepted = true
      return true
    }

    if (!(window as any).__TAURI__?.pytauri) {
      state.value.accepted = false
      return false
    }

    try {
      const result = await api.getUserAgreementStatus()
      if (result?.success && result?.data?.accepted) {
        state.value.accepted = true
        localStorage.setItem(USER_AGREEMENT_KEY, 'true')
        return true
      }
    } catch (e) {
      console.warn('[UserAgreement] 后端查询失败:', e)
    }

    state.value.accepted = false
    return false
  } finally {
    state.value.loading = false
  }
}

export async function acceptUserAgreement(): Promise<boolean> {
  try {
    if ((window as any).__TAURI__?.pytauri) {
      const result = await api.saveUserAgreement()
      if (!result?.success) {
        throw new Error(result?.message || '保存用户协议失败')
      }
    }

    localStorage.setItem(USER_AGREEMENT_KEY, 'true')
    state.value.accepted = true
    return true
  } catch (e) {
    console.error('[UserAgreement] 保存失败:', e)
    return false
  }
}

export async function rejectUserAgreement(): Promise<void> {
  localStorage.removeItem(USER_AGREEMENT_KEY)
  state.value.accepted = false

  if ((window as any).__TAURI__?.pytauri) {
    try {
      await api.clearUserAgreement()
    } catch (e) {
      console.warn('[UserAgreement] 后端清除失败:', e)
    }
  }
}

export function useUserAgreement() {
  const isAccepted = computed(() => state.value.accepted)
  const isLoading = computed(() => state.value.loading)
  const agreementUrl = computed(() => USER_AGREEMENT_URL)

  return {
    isAccepted,
    isLoading,
    agreementUrl,
    checkUserAgreement,
    acceptUserAgreement,
    rejectUserAgreement
  }
}
