import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { accountsApi } from '@/features/accounts/api/accountsApi'
import { useAccountStore } from './accountStore'

vi.mock('@/features/accounts/api/accountsApi', () => ({
  accountsApi: {
    list: vi.fn(),
    current: vi.fn(),
    addOffline: vi.fn(),
    addAuthlib: vi.fn(),
    switch: vi.fn(),
    remove: vi.fn(),
    refresh: vi.fn(),
    listAuthlibServers: vi.fn(),
    startMicrosoftLogin: vi.fn(),
    pollMicrosoftLogin: vi.fn(),
    completeMicrosoftLogin: vi.fn(),
  },
}))

const account = {
  id: 'alex',
  alias: 'Alex',
  type: 'offline' as const,
  isCurrent: true,
}

describe('accountStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(accountsApi.list).mockResolvedValue({ accounts: [account], current: account })
  })

  it('统一加载账户列表与当前账户', async () => {
    const store = useAccountStore()
    await store.load()

    expect(store.accounts).toEqual([account])
    expect(store.currentAccount).toEqual(account)
    expect(store.status).toBe('ready')
  })

  it('切换账户后重新同步领域状态', async () => {
    const store = useAccountStore()
    await store.switchAccount('alex')

    expect(accountsApi.switch).toHaveBeenCalledWith('alex')
    expect(accountsApi.list).toHaveBeenCalledOnce()
    expect(store.currentAccount?.id).toBe('alex')
  })
})
