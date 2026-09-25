import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useInstanceStore } from './instanceStore'

const mocks = vi.hoisted(() => ({
  loadSettings: vi.fn(),
  scan: vi.fn(),
  onVersionsChanged: vi.fn(() => () => undefined),
}))

vi.mock('@/features/settings/stores/settingsStore', () => ({
  useSettingsStore: () => ({
    load: mocks.loadSettings,
    game: { minecraft_paths: [] },
  }),
}))
vi.mock('@/features/instances/api/instanceInstallApi', () => ({
  instanceInstallApi: { scan: mocks.scan, onVersionsChanged: mocks.onVersionsChanged },
}))

describe('instanceStore 启动预取', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('首页和下载预取共用首次加载，完成后再次确保加载不会覆盖当前选择', async () => {
    let finish!: () => void
    mocks.loadSettings.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        })
    )
    const store = useInstanceStore()
    const home = store.loadAll()
    const prefetch = store.ensureLoaded()
    expect(mocks.loadSettings).toHaveBeenCalledTimes(1)
    finish()
    await Promise.all([home, prefetch])
    await store.ensureLoaded()
    expect(mocks.loadSettings).toHaveBeenCalledTimes(1)
    expect(mocks.scan).not.toHaveBeenCalled()
  })
})
