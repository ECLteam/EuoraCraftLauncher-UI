import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { accountsApi } from '@/features/accounts/api/accountsApi'
import { openExternalUrl } from '@/utils/openExternal'
import { useAccountManager } from './useAccountManager'

const mocks = vi.hoisted(() => ({
  copy: vi.fn(),
  info: vi.fn(),
  resume: vi.fn(),
  pause: vi.fn(),
  runOnce: vi.fn(),
}))

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
    success: vi.fn(),
    error: vi.fn(),
    info: mocks.info,
  }),
}))

vi.mock('./useIntervalFn', () => ({
  useIntervalFn: () => ({
    resume: mocks.resume,
    pause: mocks.pause,
    runOnce: mocks.runOnce,
  }),
}))

describe('useAccountManager Microsoft login', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(accountsApi.list).mockResolvedValue({ accounts: [], current: null })
  })

  it('opens the browser and copies the device code after login starts', async () => {
    vi.mocked(accountsApi.startMicrosoftLogin).mockResolvedValue({
      status: 'pending',
      userCode: 'ABCD-EFGH',
      verificationUri: 'https://microsoft.com/link',
      interval: 5,
    })
    const account = useAccountManager((key) => key)

    await account.startMicrosoftLogin()
    await Promise.resolve()

    expect(openExternalUrl).toHaveBeenCalledWith('https://microsoft.com/link')
    expect(mocks.copy).toHaveBeenCalledWith('ABCD-EFGH')
    expect(account.showMicrosoftLoginModal).toBe(true)
    expect(mocks.resume).toHaveBeenCalled()
  })

  it('keeps polling when authorization is not finished yet', async () => {
    vi.mocked(accountsApi.completeMicrosoftLogin).mockResolvedValue({
      status: 'pending',
      retry_after: 3,
    })
    const account = useAccountManager((key) => key)
    account.showMicrosoftLoginModal = true

    await account.completeMicrosoftLogin()

    expect(account.microsoftLoginStatus).toBe('pending')
    expect(mocks.info).toHaveBeenCalledWith('game.login.autoDetecting')
    expect(mocks.resume).toHaveBeenCalled()
  })
})
