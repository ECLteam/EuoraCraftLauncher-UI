import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { accountsApi } from '@/features/accounts/api/accountsApi'
import type {
  AuthlibServer,
  MinecraftAccount,
  MicrosoftCompleteData,
  MicrosoftLoginConfigData,
  MicrosoftLoginData,
  MicrosoftLoginStatusEvent,
  MicrosoftPollData,
} from '@/types/api'

export const useAccountStore = defineStore('accounts', () => {
  const accounts = ref<MinecraftAccount[]>([])
  const currentAccount = ref<MinecraftAccount | null>(null)
  const authlibServers = ref<AuthlibServer[]>([])
  const microsoftLoginConfig = ref<MicrosoftLoginConfigData>({
    available: false,
    needs_client_id: false,
  })
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const authlibStatus = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const microsoftLoginConfigStatus = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const error = ref('')

  const isLoading = computed(() => status.value === 'loading')
  const isAuthlibLoading = computed(() => authlibStatus.value === 'loading')
  const isMicrosoftLoginConfigLoading = computed(() => microsoftLoginConfigStatus.value === 'loading')

  function accountIdentity(account: MinecraftAccount): string {
    const accountUuid = account.uuid?.replaceAll('-', '').trim().toLowerCase()
    if (accountUuid) {
      const server = account.type === 'authlib' ? account.auth_server || '' : ''
      return `${account.type}:uuid:${server}:${accountUuid}`
    }

    const email = account.email?.trim().toLowerCase()
    if (email) {
      const server = account.type === 'authlib' ? account.auth_server || '' : ''
      return `${account.type}:email:${server}:${email}`
    }
    if (account.type === 'offline') return `offline:alias:${account.alias.trim().toLowerCase()}`
    return `${account.type}:id:${account.id}`
  }

  function deduplicateAccounts(items: MinecraftAccount[], currentId?: string): MinecraftAccount[] {
    const uniqueAccounts = new Map<string, MinecraftAccount>()
    for (const account of items) {
      const identity = accountIdentity(account)
      const existing = uniqueAccounts.get(identity)
      if (!existing || account.id === currentId) uniqueAccounts.set(identity, account)
    }
    return [...uniqueAccounts.values()]
  }

  async function load(): Promise<void> {
    status.value = 'loading'
    error.value = ''
    try {
      const result = await accountsApi.list()
      const loadedAccounts = deduplicateAccounts(result.accounts ?? [], result.current?.id)
      accounts.value = loadedAccounts
      currentAccount.value = result.current
        ? (loadedAccounts.find((account) => account.id === result.current?.id) ?? result.current)
        : null
      status.value = 'ready'
    } catch (reason) {
      status.value = 'error'
      error.value = reason instanceof Error ? reason.message : '读取账户失败'
      throw reason
    }
  }

  async function loadCurrent(): Promise<void> {
    currentAccount.value = await accountsApi.current()
  }

  async function addOffline(username: string, uuid?: string): Promise<void> {
    await accountsApi.addOffline(username, uuid)
    await load()
  }

  async function addAuthlib(serverUrl: string, email: string, password: string): Promise<void> {
    await accountsApi.addAuthlib(serverUrl, email, password)
    await Promise.all([load(), loadAuthlibServers(true)])
  }

  async function switchAccount(accountId: string): Promise<void> {
    await accountsApi.switch(accountId)
    await load()
  }

  async function removeAccount(accountId: string): Promise<void> {
    await accountsApi.remove(accountId)
    await load()
  }

  async function refreshAccount(accountId: string): Promise<void> {
    await accountsApi.refresh(accountId)
    await load()
  }

  async function loadAuthlibServers(force = false): Promise<void> {
    if (!force && (authlibStatus.value === 'loading' || authlibStatus.value === 'ready')) return
    authlibStatus.value = 'loading'
    try {
      authlibServers.value = await accountsApi.listAuthlibServers()
      authlibStatus.value = 'ready'
    } catch (reason) {
      authlibServers.value = []
      authlibStatus.value = 'error'
      throw reason
    }
  }

  function startMicrosoftLogin(): Promise<MicrosoftLoginData> {
    return accountsApi.startMicrosoftLogin()
  }

  async function loadMicrosoftLoginConfig(): Promise<void> {
    microsoftLoginConfigStatus.value = 'loading'
    try {
      microsoftLoginConfig.value = await accountsApi.getMicrosoftLoginConfig()
      microsoftLoginConfigStatus.value = 'ready'
    } catch (reason) {
      microsoftLoginConfig.value = { available: false, needs_client_id: true }
      microsoftLoginConfigStatus.value = 'error'
      throw reason
    }
  }

  function pollMicrosoftLogin(): Promise<MicrosoftPollData> {
    return accountsApi.pollMicrosoftLogin()
  }

  function cancelMicrosoftLogin(): Promise<void> {
    return accountsApi.cancelMicrosoftLogin()
  }

  async function completeMicrosoftLogin(): Promise<MicrosoftCompleteData> {
    const result = await accountsApi.completeMicrosoftLogin()
    if (result.account) await load()
    return result
  }

  function onMicrosoftLoginStatus(handler: (event: MicrosoftLoginStatusEvent) => void): () => void {
    return accountsApi.onMicrosoftLoginStatus(handler)
  }

  return {
    accounts,
    currentAccount,
    authlibServers,
    microsoftLoginConfig,
    status,
    authlibStatus,
    microsoftLoginConfigStatus,
    error,
    isLoading,
    isAuthlibLoading,
    isMicrosoftLoginConfigLoading,
    load,
    loadCurrent,
    addOffline,
    addAuthlib,
    switchAccount,
    removeAccount,
    refreshAccount,
    loadAuthlibServers,
    loadMicrosoftLoginConfig,
    startMicrosoftLogin,
    pollMicrosoftLogin,
    cancelMicrosoftLogin,
    completeMicrosoftLogin,
    onMicrosoftLoginStatus,
  }
})
