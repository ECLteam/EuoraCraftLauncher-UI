import { storeToRefs } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { useAccountStore } from '@/features/accounts/stores/accountStore'
import type { MinecraftAccount, MicrosoftLoginData } from '@/types/api'
import { openExternalUrl } from '@/utils/openExternal'
import { useClipboard } from './useClipboard'
import { useGlassMessage } from './useGlassMessage'
import { useIntervalFn } from './useIntervalFn'

export type Account = MinecraftAccount

export function useAccountManager(t: (key: string, ...args: unknown[]) => string) {
  const message = useGlassMessage()
  const { copied: copiedUserCode, copy: copyToClipboard } = useClipboard()
  const accountStore = useAccountStore()
  const {
    accounts,
    currentAccount,
    isLoading: accountsLoading,
    authlibServers,
    isAuthlibLoading: authlibServersLoading,
  } = storeToRefs(accountStore)

  const showAccountModal = ref(false)
  const newOfflineUsername = ref('')
  const addingOffline = ref(false)

  // Authlib
  const showAuthlibForm = ref(false)
  const authlibServerUrl = ref('')
  const authlibEmail = ref('')
  const authlibPassword = ref('')
  const addingAuthlib = ref(false)
  const authlibServerOptions = computed(() =>
    authlibServers.value.map((server) => ({
      value: server.url,
      label: server.name || server.url,
      desc: server.description || server.url,
    }))
  )

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

  const {
    resume: startPolling,
    pause: stopPolling,
    runOnce,
  } = useIntervalFn(
    async () => {
      if (!showMicrosoftLoginModal.value || microsoftLoginStatus.value !== 'pending') {
        stopPolling()
        return
      }
      if (isPolling) return
      isPolling = true
      try {
        const result = await accountStore.pollMicrosoftLogin()
        if (result.status === 'ready') {
          stopPolling()
          microsoftLoginStatus.value = 'loading'
          await completeMicrosoftLogin()
        } else if (result.status === 'error') {
          stopPolling()
          microsoftLoginStatus.value = 'error'
          microsoftLoginError.value = result.message || t('game.login.failed')
          message.error(microsoftLoginError.value)
        } else if (result.status === 'pending' && result.retry_after && result.retry_after > 0) {
          stopPolling()
          pollInterval.value = result.retry_after * 1000
          startPolling()
        }
      } catch {
        // 临时查询失败时保留轮询，下一周期继续尝试。
      } finally {
        isPolling = false
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
    try {
      await accountStore.load()
    } catch {
      message.error(t('game.status.accountLoadFailed'))
    }
  }

  async function loadCurrentAccount() {
    try {
      await accountStore.loadCurrent()
    } catch {
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
    loadAuthlibServers()
  }

  async function addOfflineAccount() {
    const username = newOfflineUsername.value.trim()
    if (!username) {
      message.error(t('game.status.emptyUsername'))
      return
    }

    addingOffline.value = true
    try {
      await accountStore.addOffline(username)
      message.success(t('game.status.accountAdded'))
      newOfflineUsername.value = ''
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : t('game.status.accountAddFailed'))
    } finally {
      addingOffline.value = false
    }
  }

  async function switchAccount(accountId: string) {
    try {
      await accountStore.switchAccount(accountId)
      message.success(t('game.status.accountSwitched'))
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : t('game.status.accountSwitchFailed'))
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
      await accountStore.removeAccount(accountToDelete.value.id)
      message.success(t('game.status.accountRemoved'))
      showDeleteConfirmModal.value = false
      accountToDelete.value = null
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : t('game.status.accountRemoveFailed'))
    } finally {
      deletingAccount.value = false
    }
  }

  // ── Authlib ──

  async function loadAuthlibServers() {
    try {
      await accountStore.loadAuthlibServers()
    } catch {
      // 可选服务器列表失败时仍允许用户手动填写地址。
    }
  }

  function toggleAuthlibForm() {
    showAuthlibForm.value = !showAuthlibForm.value
    if (showAuthlibForm.value && authlibServers.value.length === 0) {
      loadAuthlibServers()
    }
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
      await accountStore.addAuthlib(serverUrl, email, password)
      message.success(t('game.status.accountAdded'))
      authlibServerUrl.value = ''
      authlibEmail.value = ''
      authlibPassword.value = ''
      showAuthlibForm.value = false
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : t('game.status.accountAddFailed'))
    } finally {
      addingAuthlib.value = false
    }
  }

  async function startMicrosoftLogin() {
    startingMicrosoftLogin.value = true
    let result: MicrosoftLoginData
    try {
      result = await accountStore.startMicrosoftLogin()
    } catch (reason) {
      message.error(reason instanceof Error ? reason.message : t('game.login.failed'))
      return
    } finally {
      startingMicrosoftLogin.value = false
    }
    if (result.needs_client_id) {
      showClientIdModal.value = true
      return
    }
    if (result.status === 'completed') {
      message.success(t('game.login.success'))
      await loadAccounts()
      return
    }
    if (result.status === 'pending' || (result.verificationUri && result.userCode)) {
      microsoftLoginData.value = {
        userCode: result.userCode || '',
        verificationUri: result.verificationUri || '',
      }
      microsoftLoginStatus.value = 'pending'
      microsoftLoginError.value = ''
      showMicrosoftLoginModal.value = true
      if (result.interval) {
        pollInterval.value = result.interval * 1000
      }
      void openMicrosoftLoginPage()
      runOnce()
      startPolling()
      return
    }
    message.error(result.message || t('game.login.failed'))
  }

  async function completeMicrosoftLogin() {
    completingMicrosoftLogin.value = true
    microsoftLoginStatus.value = 'loading'
    try {
      const result = await accountStore.completeMicrosoftLogin()
      if (result.status === 'pending') {
        microsoftLoginStatus.value = 'pending'
        if (result.retry_after && result.retry_after > 0) {
          pollInterval.value = result.retry_after * 1000
        }
        message.info(t('game.login.autoDetecting'))
        startPolling()
        return
      }
      if (!result.account) throw new Error(result.message || t('game.login.failed'))
      message.success(t('game.login.success'))
      showMicrosoftLoginModal.value = false
    } catch (reason) {
      microsoftLoginStatus.value = 'error'
      microsoftLoginError.value = reason instanceof Error ? reason.message : t('game.login.failed')
      message.error(microsoftLoginError.value)
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
    await copyToClipboard(microsoftLoginData.value.userCode || '')
  }

  async function openMicrosoftLoginPage() {
    const verificationUri = microsoftLoginData.value.verificationUri
    if (!verificationUri) return
    await Promise.allSettled([copyUserCode(), openExternalUrl(verificationUri)])
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
    authlibServerOptions,
    authlibServersLoading,
    loadAuthlibServers,
    toggleAuthlibForm,
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
    loadCurrentAccount,
    openAccountModal,
    addOfflineAccount,
    switchAccount,
    removeAccount,
    confirmRemoveAccount,
    startMicrosoftLogin,
    cancelMicrosoftLogin,
    completeMicrosoftLogin,
    copyUserCode,
    openMicrosoftLoginPage,
    showClientIdModal,
    cancelClientId,
    reset,
  })
}
