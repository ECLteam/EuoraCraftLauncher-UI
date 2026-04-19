import { ref, computed, reactive } from 'vue'
import { api } from '@/utils/api'
import { useGlassMessage } from './useGlassMessage'

export interface Account {
  id: string
  alias: string
  type: 'microsoft' | 'offline'
  email: string
  uuid: string
  isCurrent?: boolean
  skinUrl?: string
}

export function useAccountManager(t: (key: string, ...args: any[]) => string) {
  const message = useGlassMessage()

  const accounts = ref<Account[]>([])
  const currentAccount = ref<Account | null>(null)
  const accountsLoading = ref(false)

  const showAccountModal = ref(false)
  const newOfflineUsername = ref('')
  const addingOffline = ref(false)

  const showMicrosoftLoginModal = ref(false)
  const startingMicrosoftLogin = ref(false)
  const completingMicrosoftLogin = ref(false)
  const microsoftLoginStatus = ref<'pending' | 'loading' | 'error'>('pending')
  const microsoftLoginData = ref<{ userCode: string; verificationUri: string }>({ userCode: '', verificationUri: '' })
  const microsoftLoginError = ref('')
  const copiedUserCode = ref(false)

  const showDeleteConfirmModal = ref(false)
  const deletingAccount = ref(false)
  const accountToDelete = ref<{ id: string; alias: string } | null>(null)
  const deleteConfirmMessage = computed(() => {
    if (!accountToDelete.value) return ''
    return t('game.deleteConfirm', { name: accountToDelete.value.alias })
  })

  let pollTimer: ReturnType<typeof setInterval> | null = null
  let pollInterval = 5000

  const accountTypeLabel = computed(() => {
    return currentAccount.value?.type === 'microsoft'
      ? t('game.microsoftAccount')
      : t('game.offlineAccount')
  })

  async function loadAccounts() {
    accountsLoading.value = true
    try {
      const res = await api.getAccounts()
      if (res.success && res.data) {
        accounts.value = res.data.accounts || []
        currentAccount.value = res.data.current
      }
    } catch (e) {
      message.error(t('game.status.accountLoadFailed'))
    } finally {
      accountsLoading.value = false
    }
  }

  function openAccountModal() {
    showAccountModal.value = true
    loadAccounts()
  }

  async function addOfflineAccount() {
    const username = newOfflineUsername.value.trim()
    if (!username) {
      message.error(t('game.status.emptyUsername'))
      return
    }

    addingOffline.value = true
    try {
      const res = await api.addOfflineAccount(username)
      if (res.success) {
        message.success(t('game.status.accountAdded'))
        newOfflineUsername.value = ''
        await loadAccounts()
      } else {
        message.error(res.message || t('game.status.accountAddFailed'))
      }
    } catch (e) {
      message.error(t('game.status.accountAddFailed'))
    } finally {
      addingOffline.value = false
    }
  }

  async function switchAccount(accountId: string) {
    try {
      const res = await api.switchAccount(accountId)
      if (res.success) {
        message.success(t('game.status.accountSwitched'))
        await loadAccounts()
        const accountsRes = await api.getAccounts()
        if (accountsRes.success && accountsRes.data) {
          currentAccount.value = accountsRes.data.current
        }
      } else {
        message.error(res.message || t('game.status.accountSwitchFailed'))
      }
    } catch (e) {
      message.error(t('game.status.accountSwitchFailed'))
    }
  }

  function removeAccount(accountId: string, alias: string) {
    accountToDelete.value = { id: accountId, alias }
    showDeleteConfirmModal.value = true
  }

  async function confirmRemoveAccount() {
    if (!accountToDelete.value) return

    deletingAccount.value = true
    try {
      const res = await api.removeAccount(accountToDelete.value.id)
      if (res.success) {
        message.success(t('game.status.accountRemoved'))
        showDeleteConfirmModal.value = false
        await loadAccounts()
        const accountsRes = await api.getAccounts()
        if (accountsRes.success && accountsRes.data) {
          currentAccount.value = accountsRes.data.current
        }
      } else {
        message.error(res.message || t('game.status.accountRemoveFailed'))
      }
    } catch (e) {
      message.error(t('game.status.accountRemoveFailed'))
    } finally {
      deletingAccount.value = false
      accountToDelete.value = null
    }
  }

  async function startMicrosoftLogin() {
    startingMicrosoftLogin.value = true
    try {
      const res = await api.startMicrosoftLogin()
      if (res.success) {
        if (res.data?.status === 'completed') {
          message.success(t('game.login.success'))
          await loadAccounts()
        } else if (res.data?.status === 'pending' || (res.data?.verificationUri && res.data?.userCode)) {
          microsoftLoginData.value = {
            userCode: res.data.userCode || '',
            verificationUri: res.data.verificationUri || ''
          }
          microsoftLoginStatus.value = 'pending'
          showMicrosoftLoginModal.value = true
          if (res.data?.interval) {
            pollInterval = res.data.interval * 1000
          }
          startPolling()
        } else {
          message.error(res.data?.message || res.message || t('game.login.failed'))
        }
      } else {
        message.error(res.message || t('game.login.failed'))
      }
    } catch (e) {
      message.error(t('game.login.failed'))
    } finally {
      startingMicrosoftLogin.value = false
    }
  }

  function startPolling() {
    stopPolling()
    pollLoginStatus()
    pollTimer = setInterval(pollLoginStatus, pollInterval)
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  async function pollLoginStatus() {
    if (!showMicrosoftLoginModal.value || microsoftLoginStatus.value !== 'pending') {
      stopPolling()
      return
    }

    try {
      const res = await api.pollMicrosoftLogin()
      if (res.success) {
        if (res.data?.status === 'ready') {
          stopPolling()
          microsoftLoginStatus.value = 'loading'
          await completeMicrosoftLogin()
        } else if (res.data?.status === 'error') {
          stopPolling()
          microsoftLoginStatus.value = 'error'
          microsoftLoginError.value = res.data.message || t('game.login.failed')
          message.error(microsoftLoginError.value)
        } else if (res.data?.status === 'pending' && res.data?.retry_after && res.data.retry_after > 0) {
          stopPolling()
          pollInterval = res.data.retry_after * 1000
          startPolling()
        }
      }
    } catch (e) {
      // 轮询失败时静默等待下次轮询
    }
  }

  async function completeMicrosoftLogin() {
    completingMicrosoftLogin.value = true
    microsoftLoginStatus.value = 'loading'
    try {
      const res = await api.completeMicrosoftLogin()
      if (res.success && res.data?.account) {
        message.success(t('game.login.success'))
        showMicrosoftLoginModal.value = false
        await loadAccounts()
        const accountsRes = await api.getAccounts()
        if (accountsRes.success && accountsRes.data) {
          currentAccount.value = accountsRes.data.current
        }
      } else {
        microsoftLoginStatus.value = 'error'
        microsoftLoginError.value = res.message || res.data?.message || t('game.login.failed')
        message.error(microsoftLoginError.value)
      }
    } catch (e) {
      microsoftLoginStatus.value = 'error'
      microsoftLoginError.value = t('game.login.failed')
      message.error(t('game.login.failed'))
    } finally {
      completingMicrosoftLogin.value = false
    }
  }

  function cancelMicrosoftLogin() {
    showMicrosoftLoginModal.value = false
    microsoftLoginStatus.value = 'pending'
    microsoftLoginError.value = ''
    stopPolling()
  }

  async function copyUserCode() {
    try {
      await navigator.clipboard.writeText(microsoftLoginData.value.userCode)
      copiedUserCode.value = true
      setTimeout(() => {
        copiedUserCode.value = false
      }, 2000)
    } catch (e) {
      // 忽略复制失败
    }
  }

  function reset() {
    showAccountModal.value = false
    showMicrosoftLoginModal.value = false
    showDeleteConfirmModal.value = false
    stopPolling()
  }

  return reactive({
    accounts,
    currentAccount,
    accountsLoading,
    accountTypeLabel,
    showAccountModal,
    newOfflineUsername,
    addingOffline,
    showMicrosoftLoginModal,
    startingMicrosoftLogin,
    completingMicrosoftLogin,
    microsoftLoginStatus,
    microsoftLoginData,
    microsoftLoginError,
    copiedUserCode,
    showDeleteConfirmModal,
    deletingAccount,
    accountToDelete,
    deleteConfirmMessage,
    loadAccounts,
    openAccountModal,
    addOfflineAccount,
    switchAccount,
    removeAccount,
    confirmRemoveAccount,
    startMicrosoftLogin,
    cancelMicrosoftLogin,
    completeMicrosoftLogin,
    copyUserCode,
    reset
  })
}
