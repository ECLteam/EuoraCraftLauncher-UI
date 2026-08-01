import { storeToRefs } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { useAccountStore } from '@/features/accounts/stores/accountStore'
import type { MinecraftAccount, MicrosoftLoginData, MicrosoftLoginStatusEvent } from '@/types/api'
import { openExternalUrl } from '@/utils/openExternal'
import { useClipboard } from './useClipboard'
import { useGlassMessage } from './useGlassMessage'

export type Account = MinecraftAccount
const OFFLINE_UUID_PATTERN =
  /^(?:[0-9a-fA-F]{32}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/

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
    microsoftLoginConfig,
    isMicrosoftLoginConfigLoading,
  } = storeToRefs(accountStore)

  const showAccountModal = ref(false)
  const newOfflineUsername = ref('')
  const newOfflineUuid = ref('')
  const offlineUuidError = computed(() => {
    const value = newOfflineUuid.value.trim()
    return value && !OFFLINE_UUID_PATTERN.test(value) ? t('game.invalidOfflineUuid') : ''
  })
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

  const showDeleteConfirmModal = ref(false)
  const deletingAccount = ref(false)
  const accountToDelete = ref<{ id: string; alias: string } | null>(null)
  const deleteConfirmMessage = computed(() => {
    if (!accountToDelete.value) return ''
    return t('game.deleteConfirm', { name: accountToDelete.value.alias })
  })

  let completingFromEvent = false

  const stopMicrosoftLoginStatusListener = accountStore.onMicrosoftLoginStatus((event) => {
    void handleMicrosoftLoginStatus(event)
  })

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
    loadMicrosoftLoginConfig()
  }

  async function addOfflineAccount() {
    const username = newOfflineUsername.value.trim()
    if (!username) {
      message.error(t('game.status.emptyUsername'))
      return
    }
    if (offlineUuidError.value) {
      message.error(offlineUuidError.value)
      return
    }

    addingOffline.value = true
    try {
      const customUuid = newOfflineUuid.value.trim() || undefined
      await accountStore.addOffline(username, customUuid)
      message.success(t('game.status.accountAdded'))
      newOfflineUsername.value = ''
      newOfflineUuid.value = ''
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
    if (!microsoftLoginConfig.value.available) return
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
      microsoftLoginConfig.value = { available: false, needs_client_id: true }
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
      void openMicrosoftLoginPage()
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
        message.info(t('game.login.autoDetecting'))
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

  async function cancelMicrosoftLogin() {
    showMicrosoftLoginModal.value = false
    microsoftLoginStatus.value = 'pending'
    microsoftLoginError.value = ''
    try {
      await accountStore.cancelMicrosoftLogin()
    } catch (reason) {
      console.warn('[MicrosoftLogin] 取消登录失败:', reason)
    }
  }

  async function loadMicrosoftLoginConfig() {
    try {
      await accountStore.loadMicrosoftLoginConfig()
    } catch {
      return
    }
  }

  async function copyUserCode() {
    await copyToClipboard(microsoftLoginData.value.userCode || '')
  }

  async function openMicrosoftLoginPage() {
    const verificationUri = microsoftLoginData.value.verificationUri
    if (!verificationUri) return
    await Promise.allSettled([copyUserCode(), openExternalUrl(verificationUri)])
  }

  async function handleMicrosoftLoginStatus(event: MicrosoftLoginStatusEvent) {
    if (event.status === 'cancelled') {
      showMicrosoftLoginModal.value = false
      microsoftLoginStatus.value = 'pending'
      microsoftLoginError.value = ''
      return
    }
    if (!showMicrosoftLoginModal.value) return
    if (event.status === 'error') {
      microsoftLoginStatus.value = 'error'
      microsoftLoginError.value = event.message || t('game.login.failed')
      message.error(microsoftLoginError.value)
      return
    }
    if (event.status === 'ready' && !completingFromEvent) {
      completingFromEvent = true
      try {
        await completeMicrosoftLogin()
      } finally {
        completingFromEvent = false
      }
    }
  }

  function reset() {
    const shouldCancelMicrosoftLogin =
      showMicrosoftLoginModal.value || startingMicrosoftLogin.value || completingMicrosoftLogin.value
    showAccountModal.value = false
    showMicrosoftLoginModal.value = false
    showDeleteConfirmModal.value = false
    stopMicrosoftLoginStatusListener()
    if (shouldCancelMicrosoftLogin) {
      void accountStore.cancelMicrosoftLogin().catch((reason) => {
        console.warn('[MicrosoftLogin] 页面卸载时取消登录失败:', reason)
      })
    }
  }

  return reactive({
    accounts,
    currentAccount,
    accountsLoading,
    accountTypeLabel,
    showAccountModal,
    newOfflineUsername,
    newOfflineUuid,
    offlineUuidError,
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
    microsoftLoginConfig,
    isMicrosoftLoginConfigLoading,
    copiedUserCode,
    showDeleteConfirmModal,
    deletingAccount,
    accountToDelete,
    deleteConfirmMessage,
    loadAccounts,
    loadCurrentAccount,
    loadMicrosoftLoginConfig,
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
    reset,
  })
}
