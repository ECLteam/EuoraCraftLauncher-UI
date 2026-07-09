import { ref, computed, reactive, onScopeDispose } from 'vue'
import backend from '@/api/client'
import { useGlassMessage } from './useGlassMessage'

export interface Account {
  id: string
  alias: string
  type: 'microsoft' | 'offline' | 'authlib'
  email: string
  uuid: string
  isCurrent?: boolean
  skinUrl?: string
  auth_server?: string
}

export function useAccountManager(t: (key: string, ...args: any[]) => string) {
  const message = useGlassMessage()

  const accounts = ref<Account[]>([])
  const currentAccount = ref<Account | null>(null)
  const accountsLoading = ref(false)

  const showAccountModal = ref(false)
  const newOfflineUsername = ref('')
  const addingOffline = ref(false)

  // Authlib
  const showAuthlibForm = ref(false)
  const authlibServerUrl = ref('')
  const authlibEmail = ref('')
  const authlibPassword = ref('')
  const addingAuthlib = ref(false)
  const authlibServers = ref<{ name: string; url: string; description: string }[]>([])
  const authlibServersLoading = ref(false)

  const showMicrosoftLoginModal = ref(false)
  const startingMicrosoftLogin = ref(false)
  const completingMicrosoftLogin = ref(false)
  const microsoftLoginStatus = ref<'pending' | 'loading' | 'error'>('pending')
  const microsoftLoginData = ref<{ userCode: string; verificationUri: string }>({ userCode: '', verificationUri: '' })
  const microsoftLoginError = ref('')
  const copiedUserCode = ref(false)

  const showClientIdModal = ref(false)

  const showDeleteConfirmModal = ref(false)
  const deletingAccount = ref(false)
  const accountToDelete = ref<{ id: string; alias: string } | null>(null)
  const deleteConfirmMessage = computed(() => {
    if (!accountToDelete.value) return ''
    return t('game.deleteConfirm', { name: accountToDelete.value.alias })
  })

  let pollTimer: ReturnType<typeof setInterval> | null = null
  let pollInterval = 5000
  let isPolling = false

  onScopeDispose(() => {
    stopPolling()
  })

  const accountTypeLabel = computed(() => {
    const type = currentAccount.value?.type
    if (type === 'microsoft') return t('game.microsoftAccount')
    if (type === 'authlib') return t('game.authlibAccount')
    return t('game.offlineAccount')
  })

  async function loadAccounts() {
    accountsLoading.value = true
    try {
      const res = await backend.command('accounts_list')
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
    showAuthlibForm.value = false
    authlibServerUrl.value = ''
    authlibEmail.value = ''
    authlibPassword.value = ''
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
      const res = await backend.command('accounts_add_offline', { username })
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
      const res = await backend.command('accounts_switch', { account_id: accountId })
      if (res.success) {
        message.success(t('game.status.accountSwitched'))
        await loadAccounts()
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
      const res = await backend.command('accounts_remove', { account_id: accountToDelete.value.id })
      if (res.success) {
        message.success(t('game.status.accountRemoved'))
        showDeleteConfirmModal.value = false
        await loadAccounts()
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

  // ── Authlib ──

  async function loadAuthlibServers() {
    authlibServersLoading.value = true
    try {
      const res = await backend.command('authlib_servers')
      if (res.success && res.data) {
        authlibServers.value = res.data
      }
    } catch (e) {
      // 静默
    } finally {
      authlibServersLoading.value = false
    }
  }

  function toggleAuthlibForm() {
    showAuthlibForm.value = !showAuthlibForm.value
    if (showAuthlibForm.value && authlibServers.value.length === 0) {
      loadAuthlibServers()
    }
  }

  function selectAuthlibServer(server: { name: string; url: string; description: string }) {
    authlibServerUrl.value = server.url
  }

  async function addAuthlibAccount() {
    const serverUrl = authlibServerUrl.value.trim()
    const email = authlibEmail.value.trim()
    const password = authlibPassword.value

    if (!serverUrl) {
      message.error(t('auth.serverUrlRequired'))
      return
    }
    if (!email) {
      message.error(t('auth.emailRequired'))
      return
    }
    if (!password) {
      message.error(t('auth.passwordRequired'))
      return
    }

    addingAuthlib.value = true
    try {
      const res = await backend.command('accounts_add_authlib', {
        server_url: serverUrl,
        email,
        password,
      })
      if (res.success) {
        message.success(t('game.status.accountAdded'))
        authlibServerUrl.value = ''
        authlibEmail.value = ''
        authlibPassword.value = ''
        showAuthlibForm.value = false
        await loadAccounts()
      } else {
        message.error(res.message || t('game.status.accountAddFailed'))
      }
    } catch (e) {
      message.error(t('game.status.accountAddFailed'))
    } finally {
      addingAuthlib.value = false
    }
  }

  async function startMicrosoftLogin() {
    startingMicrosoftLogin.value = true
    try {
      const res = await backend.command('accounts_start_microsoft_login')
      if (res.success) {
        if (res.data?.needs_client_id) {
          showClientIdModal.value = true
          startingMicrosoftLogin.value = false
          return
        }
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
    isPolling = false
  }

  async function pollLoginStatus() {
    if (!showMicrosoftLoginModal.value || microsoftLoginStatus.value !== 'pending') {
      stopPolling()
      return
    }
    if (isPolling) return
    isPolling = true
    try {
      const res = await backend.command('accounts_poll_microsoft_login')
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
    } finally {
      isPolling = false
    }
  }

  async function completeMicrosoftLogin() {
    completingMicrosoftLogin.value = true
    microsoftLoginStatus.value = 'loading'
    try {
      const res = await backend.command('accounts_complete_microsoft_login')
      if (res.success && res.data?.account) {
        message.success(t('game.login.success'))
        showMicrosoftLoginModal.value = false
        await loadAccounts()
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

  function cancelClientId() {
    showClientIdModal.value = false
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
    isPolling = false
  }

  return reactive({
    accounts,
    currentAccount,
    accountsLoading,
    accountTypeLabel,
    showAccountModal,
    newOfflineUsername,
    addingOffline,
    // Authlib
    showAuthlibForm,
    authlibServerUrl,
    authlibEmail,
    authlibPassword,
    addingAuthlib,
    authlibServers,
    authlibServersLoading,
    loadAuthlibServers,
    toggleAuthlibForm,
    selectAuthlibServer,
    addAuthlibAccount,
    // Microsoft
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
    showClientIdModal,
    cancelClientId,
    reset
  })
}