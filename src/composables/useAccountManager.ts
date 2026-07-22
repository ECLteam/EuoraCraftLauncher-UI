import { ref, computed, reactive } from 'vue'
import backend from '@/api/client'
import { useClipboard } from './useClipboard'
import { useGlassMessage } from './useGlassMessage'
import { useIntervalFn } from './useIntervalFn'
import type {
  AuthlibServer,
  MinecraftAccount,
  MicrosoftLoginData,
} from '@/types/api'

export type Account = MinecraftAccount

export function useAccountManager(t: (key: string, ...args: unknown[]) => string) {
  const message = useGlassMessage()
  const { copied: copiedUserCode, copy: copyToClipboard } = useClipboard()

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
  const authlibServers = ref<AuthlibServer[]>([])
  const authlibServersLoading = ref(false)

  const showMicrosoftLoginModal = ref(false)
  const startingMicrosoftLogin = ref(false)
  const completingMicrosoftLogin = ref(false)
  const microsoftLoginStatus = ref<'pending' | 'loading' | 'error'>('pending')
  const microsoftLoginData = ref<Pick<MicrosoftLoginData, 'userCode' | 'verificationUri'>>({
    userCode: '',
    verificationUri: '',
  })
  const microsoftLoginError = ref('')

  const showClientIdModal = ref(false)

  const showDeleteConfirmModal = ref(false)
  const deletingAccount = ref(false)
  const accountToDelete = ref<{ id: string; alias: string } | null>(null)
  const deleteConfirmMessage = computed(() => {
    if (!accountToDelete.value) return ''
    return t('game.deleteConfirm', { name: accountToDelete.value.alias })
  })

  const pollInterval = ref(5000)
  let isPolling = false

  const { resume: startPolling, pause: stopPolling, runOnce } = useIntervalFn(
    async () => {
      if (!showMicrosoftLoginModal.value || microsoftLoginStatus.value !== 'pending') {
        stopPolling()
        return
      }
      if (isPolling) return
      isPolling = true
      const res = await backend.command('accounts_poll_microsoft_login')
      isPolling = false
      if (!res.success) return
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
        pollInterval.value = res.data.retry_after * 1000
        startPolling()
      }
    },
    () => pollInterval.value
  )

  const accountTypeLabel = computed(() => {
    const type = currentAccount.value?.type
    if (type === 'microsoft') return t('game.microsoftAccount')
    if (type === 'authlib') return t('game.authlibAccount')
    return t('game.offlineAccount')
  })

  async function loadAccounts() {
    accountsLoading.value = true
    const res = await backend.command('accounts_list')
    accountsLoading.value = false
    if (res.success && res.data) {
      accounts.value = res.data.accounts || []
      currentAccount.value = res.data.current
    } else {
      message.error(t('game.status.accountLoadFailed'))
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
    const res = await backend.command('accounts_add_offline', { username })
    addingOffline.value = false
    if (res.success) {
      message.success(t('game.status.accountAdded'))
      newOfflineUsername.value = ''
      await loadAccounts()
    } else {
      message.error(res.message || t('game.status.accountAddFailed'))
    }
  }

  async function switchAccount(accountId: string) {
    const res = await backend.command('accounts_switch', { account_id: accountId })
    if (res.success) {
      message.success(t('game.status.accountSwitched'))
      await loadAccounts()
    } else {
      message.error(res.message || t('game.status.accountSwitchFailed'))
    }
  }

  function removeAccount(accountId: string, alias: string) {
    accountToDelete.value = { id: accountId, alias }
    showDeleteConfirmModal.value = true
  }

  async function confirmRemoveAccount() {
    if (!accountToDelete.value) return

    deletingAccount.value = true
    const res = await backend.command('accounts_remove', { account_id: accountToDelete.value.id })
    deletingAccount.value = false
    accountToDelete.value = null
    if (res.success) {
      message.success(t('game.status.accountRemoved'))
      showDeleteConfirmModal.value = false
      await loadAccounts()
    } else {
      message.error(res.message || t('game.status.accountRemoveFailed'))
    }
  }

  // ── Authlib ──

  async function loadAuthlibServers() {
    authlibServersLoading.value = true
    const res = await backend.command('authlib_servers')
    authlibServersLoading.value = false
    if (res.success && res.data) {
      authlibServers.value = res.data
    }
  }

  function toggleAuthlibForm() {
    showAuthlibForm.value = !showAuthlibForm.value
    if (showAuthlibForm.value && authlibServers.value.length === 0) {
      loadAuthlibServers()
    }
  }

  function selectAuthlibServer(server: AuthlibServer) {
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
    const res = await backend.command('accounts_add_authlib', {
      server_url: serverUrl,
      email,
      password,
    })
    addingAuthlib.value = false
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
  }

  async function startMicrosoftLogin() {
    startingMicrosoftLogin.value = true
    const res = await backend.command('accounts_start_microsoft_login')
    startingMicrosoftLogin.value = false
    if (!res.success) {
      message.error(res.message || t('game.login.failed'))
      return
    }
    if (res.data?.needs_client_id) {
      showClientIdModal.value = true
      return
    }
    if (res.data?.status === 'completed') {
      message.success(t('game.login.success'))
      await loadAccounts()
      return
    }
    if (res.data?.status === 'pending' || (res.data?.verificationUri && res.data?.userCode)) {
      microsoftLoginData.value = {
        userCode: res.data.userCode || '',
        verificationUri: res.data.verificationUri || ''
      }
      microsoftLoginStatus.value = 'pending'
      showMicrosoftLoginModal.value = true
      if (res.data?.interval) {
        pollInterval.value = res.data.interval * 1000
      }
      runOnce()
      startPolling()
      return
    }
    message.error(res.data?.message || res.message || t('game.login.failed'))
  }

  async function completeMicrosoftLogin() {
    completingMicrosoftLogin.value = true
    microsoftLoginStatus.value = 'loading'
    const res = await backend.command('accounts_complete_microsoft_login')
    completingMicrosoftLogin.value = false
    if (res.success && res.data?.account) {
      message.success(t('game.login.success'))
      showMicrosoftLoginModal.value = false
      await loadAccounts()
    } else {
      microsoftLoginStatus.value = 'error'
      microsoftLoginError.value = res.message || res.data?.message || t('game.login.failed')
      message.error(microsoftLoginError.value)
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
    await copyToClipboard(microsoftLoginData.value.userCode || '')
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
