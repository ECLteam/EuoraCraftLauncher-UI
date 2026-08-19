import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { accountsApi } from '@/features/accounts/api/accountsApi'
import { useAccountStore } from './accountStore'

vi.mock('@/features/accounts/api/accountsApi', () => ({
  accountsApi: {
    list: vi.fn(),
    current: vi.fn(),
    addOffline: vi.fn(),
    addAuthlib: vi.fn(),
    selectAuthlibProfile: vi.fn(),
    resolveAuthlibServer: vi.fn(),
    switch: vi.fn(),
    remove: vi.fn(),
    refresh: vi.fn(),
    listAuthlibServers: vi.fn(),
    getMicrosoftLoginConfig: vi.fn(),
    startMicrosoftLogin: vi.fn(),
    pollMicrosoftLogin: vi.fn(),
    cancelMicrosoftLogin: vi.fn(),
    completeMicrosoftLogin: vi.fn(),
    onMicrosoftLoginStatus: vi.fn(),
    setFavorite: vi.fn(),
    setPinned: vi.fn(),
    defaultSkins: vi.fn(),
    setOfflineSkin: vi.fn(),
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
    setActivePinia(createTestingPinia({ stubActions: false }))
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

  it('按账户 UUID 合并重复账户并保留当前账户', async () => {
    const previousAccount = {
      id: 'microsoft-old',
      alias: 'Player',
      type: 'microsoft' as const,
      uuid: '01234567-89ab-cdef-0123-456789abcdef',
      isCurrent: false,
    }
    const currentAccount = {
      ...previousAccount,
      id: 'microsoft-new',
      uuid: '0123456789abcdef0123456789abcdef',
      isCurrent: true,
    }
    vi.mocked(accountsApi.list).mockResolvedValue({
      accounts: [previousAccount, currentAccount],
      current: currentAccount,
    })
    const store = useAccountStore()

    await store.load()

    expect(store.accounts).toEqual([currentAccount])
    expect(store.currentAccount).toEqual(currentAccount)
  })

  it('切换账户后重新同步领域状态', async () => {
    const store = useAccountStore()
    await store.switchAccount('alex')

    expect(accountsApi.switch).toHaveBeenCalledWith('alex')
    expect(accountsApi.list).toHaveBeenCalledOnce()
    expect(store.currentAccount?.id).toBe('alex')
  })

  it('添加离线账户时转发可选 UUID', async () => {
    const store = useAccountStore()
    vi.mocked(accountsApi.addOffline).mockResolvedValue(account)

    await store.addOffline('Alex', '01234567-89ab-cdef-0123-456789abcdef')

    expect(accountsApi.addOffline).toHaveBeenCalledWith('Alex', '01234567-89ab-cdef-0123-456789abcdef', undefined)
  })

  it('添加离线账户时转发可选皮肤', async () => {
    const store = useAccountStore()
    vi.mocked(accountsApi.addOffline).mockResolvedValue(account)

    await store.addOffline('Steve', undefined, 'alice')

    expect(accountsApi.addOffline).toHaveBeenCalledWith('Steve', undefined, 'alice')
    expect(accountsApi.defaultSkins).not.toHaveBeenCalled()
  })

  it('读取默认皮肤列表时转发到后端', async () => {
    const store = useAccountStore()
    vi.mocked(accountsApi.defaultSkins).mockResolvedValue([
      { id: 'alice', name: 'Alice', skinUrl: 'data:image/png;base64,AAAA' },
    ])

    const skins = await store.defaultSkins()

    expect(skins).toHaveLength(1)
    expect(accountsApi.defaultSkins).toHaveBeenCalledOnce()
  })

  it('设置离线皮肤后刷新账户列表', async () => {
    const store = useAccountStore()
    vi.mocked(accountsApi.setOfflineSkin).mockResolvedValue({ accounts: [account], current: account })

    await store.setOfflineSkin('alex', 'alice')

    expect(accountsApi.setOfflineSkin).toHaveBeenCalledWith('alex', 'alice')
    expect(accountsApi.list).toHaveBeenCalledOnce()
  })

  it('将微软登录取消请求转发到后端', async () => {
    vi.mocked(accountsApi.cancelMicrosoftLogin).mockResolvedValue()
    const store = useAccountStore()

    await store.cancelMicrosoftLogin()

    expect(accountsApi.cancelMicrosoftLogin).toHaveBeenCalledOnce()
  })

  it('订阅后端推送的微软登录状态', () => {
    const handler = vi.fn()
    const unlisten = vi.fn()
    vi.mocked(accountsApi.onMicrosoftLoginStatus).mockReturnValue(unlisten)
    const store = useAccountStore()

    expect(store.onMicrosoftLoginStatus(handler)).toBe(unlisten)
    expect(accountsApi.onMicrosoftLoginStatus).toHaveBeenCalledWith(handler)
  })

  it('loads Microsoft login availability from the backend', async () => {
    vi.mocked(accountsApi.getMicrosoftLoginConfig).mockResolvedValue({
      available: false,
      needs_client_id: true,
    })
    const store = useAccountStore()

    await store.loadMicrosoftLoginConfig()

    expect(store.microsoftLoginConfig).toEqual({
      available: false,
      needs_client_id: true,
    })
    expect(store.microsoftLoginConfigStatus).toBe('ready')
  })
})
