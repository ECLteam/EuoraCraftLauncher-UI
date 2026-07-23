import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { settingsApi } from '@/features/settings/api/settingsApi'
import { useSettingsStore } from './settingsStore'

vi.mock('@/features/settings/api/settingsApi', () => ({
  settingsApi: {
    load: vi.fn(),
    saveUi: vi.fn(),
    saveGame: vi.fn(),
    saveDownload: vi.fn(),
    selectImage: vi.fn(),
    saveImageUrl: vi.fn(),
    readImage: vi.fn(),
  },
}))

describe('settingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(settingsApi.load).mockResolvedValue({
      ui: {},
      game: {
        minecraft_paths: [{ name: '主目录', path: 'D:/Minecraft' }],
        jvm_args: ['-XX:+UseG1GC'],
        memory_size: 6144,
      },
      download: { mirror_source: 'bmclapi', download_threads: 12 },
    })
  })

  it('加载时补齐默认值但保留后端配置', async () => {
    const store = useSettingsStore()
    await store.load()

    expect(store.status).toBe('ready')
    expect(store.game.java_auto).toBe(true)
    expect(store.game.minecraft_paths).toEqual([{ name: '主目录', path: 'D:/Minecraft' }])
    expect(store.download.download_threads).toBe(12)
  })

  it('更新局部游戏设置时不覆盖路径与 JVM 参数', async () => {
    const store = useSettingsStore()
    await store.load()
    await store.patchGame({ fullscreen: true })

    expect(settingsApi.saveGame).toHaveBeenCalledWith(
      expect.objectContaining({
        fullscreen: true,
        minecraft_paths: [{ name: '主目录', path: 'D:/Minecraft' }],
        jvm_args: ['-XX:+UseG1GC'],
      })
    )
  })
})
