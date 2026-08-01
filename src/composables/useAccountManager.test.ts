import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { accountsApi } from '@/features/accounts/api/accountsApi'
import type { MicrosoftLoginStatusEvent } from '@/types/api'
import { openExternalUrl } from '@/utils/openExternal'
import { useAccountManager } from './useAccountManager'

const mocks = vi.hoisted(() => ({
  copy: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}))

let microsoftLoginStatusHandler: ((event: MicrosoftLoginStatusEvent) => void) | undefined

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
    getMicrosoftLoginConfig: vi.fn(),
    startMicrosoftLogin: vi.fn(),
    pollMicrosoftLogin: vi.fn(),
    cancelMicrosoftLogin: vi.fn(),
    completeMicrosoftLogin: vi.fn(),
    onMicrosoftLoginStatus: vi.fn(),
  },
}))

vi.mock('@/utils/openExternal', () => ({
  openExternalUrl: vi.fn(),
}))

vi.mock('./useClipboard', () => ({
  useClipboard: () => ({
    copied: { value: false },
    copy: mocks.copy,
  }),
}))

vi.mock('./useGlassMessage', () => ({
  useGlassMessage: () => ({
    success: mocks.success,
    error: mocks.error,
    info: mocks.info,
  }),
}))

describe('useAccountManager Microsoft login', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(accountsApi.list).mockResolvedValue({ accounts: [], current: null })
    vi.mocked(accountsApi.getMicrosoftLoginConfig).mockResolvedValue({
      available: true,
      needs_client_id: false,
    })
    vi.mocked(accountsApi.onMicrosoftLoginStatus).mockImplementation((handler) => {
      microsoftLoginStatusHandler = handler
      return vi.fn()
    })
  })

  it('opens the browser and copies the device code after login starts', async () => {
    vi.mocked(accountsApi.startMicrosoftLogin).mockResolvedValue({
      status: 'pending',
      userCode: 'ABCD-EFGH',
      verificationUri: 'https://microsoft.com/link',
      interval: 5,
    })
    const account = useAccountManager((key) => key)

    await account.loadMicrosoftLoginConfig()
    await account.startMicrosoftLogin()
    await Promise.resolve()

    expect(openExternalUrl).toHaveBeenCalledWith('https://microsoft.com/link')
    expect(mocks.copy).toHaveBeenCalledWith('ABCD-EFGH')
    expect(account.showMicrosoftLoginModal).toBe(true)
    expect(accountsApi.pollMicrosoftLogin).not.toHaveBeenCalled()
  })

  it('does not start login when MICROSOFT_CLIENT_ID is missing', async () => {
    vi.mocked(accountsApi.getMicrosoftLoginConfig).mockResolvedValue({
      available: false,
      needs_client_id: true,
    })
    const account = useAccountManager((key) => key)

    await account.loadMicrosoftLoginConfig()
    await account.startMicrosoftLogin()

    expect(account.microsoftLoginConfig.needs_client_id).toBe(true)
    expect(accountsApi.startMicrosoftLogin).not.toHaveBeenCalled()
  })

  it('添加离线账户时向后端传递有效的自定义 UUID', async () => {
    vi.mocked(accountsApi.addOffline).mockResolvedValue({
      id: 'offline:custom',
      alias: 'CustomPlayer',
      type: 'offline',
      uuid: '01234567-89ab-cdef-0123-456789abcdef',
      isCurrent: true,
    })
    const account = useAccountManager((key) => key)
    account.newOfflineUsername = 'CustomPlayer'
    account.newOfflineUuid = '0123456789abcdef0123456789abcdef'

    await account.addOfflineAccount()

    expect(accountsApi.addOffline).toHaveBeenCalledWith(
      'CustomPlayer',
      '0123456789abcdef0123456789abcdef'
    )
    expect(account.newOfflineUuid).toBe('')
  })

  it('自定义 UUID 格式无效时不发送添加请求', async () => {
    const account = useAccountManager((key) => key)
    account.newOfflineUsername = 'CustomPlayer'
    account.newOfflineUuid = 'invalid-uuid'

    await account.addOfflineAccount()

    expect(account.offlineUuidError).toBe('game.invalidOfflineUuid')
    expect(accountsApi.addOffline).not.toHaveBeenCalled()
    expect(mocks.error).toHaveBeenCalledWith('game.invalidOfflineUuid')
  })

  it('completes login when the backend pushes a ready event', async () => {
    vi.mocked(accountsApi.completeMicrosoftLogin).mockResolvedValue({
      status: 'completed',
      account: {
        id: 'microsoft-account',
        alias: 'Player',
        type: 'microsoft',
        isCurrent: true,
      },
    })
    const account = useAccountManager((key) => key)
    account.showMicrosoftLoginModal = true

    microsoftLoginStatusHandler?.({ status: 'ready' })
    await vi.waitFor(() => expect(accountsApi.completeMicrosoftLogin).toHaveBeenCalledOnce())
    await vi.waitFor(() => expect(account.showMicrosoftLoginModal).toBe(false))

    expect(accountsApi.pollMicrosoftLogin).not.toHaveBeenCalled()
  })

  it('cancels the backend login flow when the login window closes', async () => {
    vi.mocked(accountsApi.cancelMicrosoftLogin).mockResolvedValue()
    const account = useAccountManager((key) => key)
    account.showMicrosoftLoginModal = true

    await account.cancelMicrosoftLogin()

    expect(account.showMicrosoftLoginModal).toBe(false)
    expect(accountsApi.cancelMicrosoftLogin).toHaveBeenCalledOnce()
  })
})
