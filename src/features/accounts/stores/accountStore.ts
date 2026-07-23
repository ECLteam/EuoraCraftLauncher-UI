import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { accountsApi } from '@/features/accounts/api/accountsApi'
import type {
  AuthlibServer,
  MinecraftAccount,
  MicrosoftCompleteData,
  MicrosoftLoginData,
  MicrosoftPollData,
} from '@/types/api'

export const useAccountStore = defineStore('accounts', () => {
  const accounts = ref<MinecraftAccount[]>([])
  const currentAccount = ref<MinecraftAccount | null>(null)
  const authlibServers = ref<AuthlibServer[]>([])
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const authlibStatus = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const error = ref('')

  const isLoading = computed(() => status.value === 'loading')
  const isAuthlibLoading = computed(() => authlibStatus.value === 'loading')

  async function load(): Promise<void> {
    status.value = 'loading'
    error.value = ''
    try {
      const result = await accountsApi.list()
      accounts.value = result.accounts ?? []
      currentAccount.value = result.current ?? null
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

  async function addOffline(username: string): Promise<void> {
    await accountsApi.addOffline(username)
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

  function pollMicrosoftLogin(): Promise<MicrosoftPollData> {
    return accountsApi.pollMicrosoftLogin()
  }

  async function completeMicrosoftLogin(): Promise<MicrosoftCompleteData> {
    const result = await accountsApi.completeMicrosoftLogin()
    if (result.account) await load()
    return result
  }

  return {
    accounts,
    currentAccount,
    authlibServers,
    status,
    authlibStatus,
    error,
    isLoading,
    isAuthlibLoading,
    load,
    loadCurrent,
    addOffline,
    addAuthlib,
    switchAccount,
    removeAccount,
    refreshAccount,
    loadAuthlibServers,
    startMicrosoftLogin,
    pollMicrosoftLogin,
    completeMicrosoftLogin,
  }
})
