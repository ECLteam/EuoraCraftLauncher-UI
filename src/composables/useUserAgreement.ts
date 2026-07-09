import { ref, computed } from 'vue'
import backend from '@/api/client'

const USER_AGREEMENT_URL = 'https://euoracraft.zient.top/guide/user-agreement/'

interface UserAgreementState {
  accepted: boolean
  loading: boolean
}

const state = ref<UserAgreementState>({
  accepted: true,
  loading: false
})

export async function acceptUserAgreement(): Promise<boolean> {
  try {
    state.value.loading = true
    if (!(window as any).__TAURI__?.pytauri) {
      state.value.accepted = true
      return true
    }

    const result = await backend.command('user_agreement_save')
    if (!result?.success) {
      throw new Error(result?.message || '保存用户协议失败')
    }
    state.value.accepted = true
    return true
  } catch (e) {
    console.error('[UserAgreement] 保存失败:', e)
    return false
  } finally {
    state.value.loading = false
  }
}

export async function rejectUserAgreement(): Promise<void> {
  state.value.accepted = false

  if ((window as any).__TAURI__?.pytauri) {
    try {
      await backend.command('user_agreement_clear')
    } catch (e) {
      console.warn('[UserAgreement] 后端清除失败:', e)
    }
  }
}

export function useUserAgreement() {
  const isAccepted = computed(() => state.value.accepted)
  const isLoading = computed(() => state.value.loading)
  const agreementUrl = computed(() => USER_AGREEMENT_URL)

  const markNotAccepted = () => {
    state.value.accepted = false
  }

  return {
    isAccepted,
    isLoading,
    agreementUrl,
    markNotAccepted,
    acceptUserAgreement,
    rejectUserAgreement
  }
}
