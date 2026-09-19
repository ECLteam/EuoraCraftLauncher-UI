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
    selectBackgroundVideo: vi.fn(),
    openBackgroundVideo: vi.fn(),
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
      download: { mirror_source: 'bmclapi' },
      launcher: {},
    })
  })

  it('加载时补齐默认值但保留后端配置', async () => {
    const store = useSettingsStore()
    await store.load()

    expect(store.status).toBe('ready')
    expect(store.game.java_auto).toBe(true)
    expect(store.game.instance_isolation_policy).toBe('all')
    expect(store.game.jvm_args).toEqual(['-XX:+UseG1GC'])
    expect(store.game.renderer).toBe('default')
    expect(store.game.game_args_tail).toBe('')
    expect(store.game.disable_crash_analysis).toBe(false)
    expect(store.game.minecraft_paths).toEqual([{ name: '主目录', path: 'D:/Minecraft' }])
    expect(store.download.mirror_source).toBe('bmclapi')
  })

  it('更新局部设置时不覆盖路径与 JVM 参数', async () => {
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

  it('串行化同一区域的并发局部更新，避免后一次覆盖前一次字段', async () => {
    const store = useSettingsStore()
    await store.load()
    let releaseFirstSave: (() => void) | undefined
    vi.mocked(settingsApi.saveGame).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          releaseFirstSave = resolve
        })
    )

    const first = store.patchGame({ fullscreen: true })
    const second = store.patchGame({ memory_size: 8192 })
    await vi.waitFor(() => expect(settingsApi.saveGame).toHaveBeenCalledTimes(1))

    releaseFirstSave?.()
    await Promise.all([first, second])

    expect(settingsApi.saveGame).toHaveBeenLastCalledWith(
      expect.objectContaining({ fullscreen: true, memory_size: 8192 })
    )
    expect(store.game.fullscreen).toBe(true)
    expect(store.game.memory_size).toBe(8192)
  })

  it('选择视频背景后保存视频类型并请求受保护的媒体地址', async () => {
    vi.mocked(settingsApi.selectBackgroundVideo).mockResolvedValue('C:/background.mp4')
    vi.mocked(settingsApi.openBackgroundVideo).mockResolvedValue('http://127.0.0.1:9527/background/token')
    const store = useSettingsStore()
    await store.load()

    await expect(store.chooseBackgroundVideo()).resolves.toEqual({
      path: 'C:/background.mp4',
      videoUrl: 'http://127.0.0.1:9527/background/token',
    })
    expect(settingsApi.saveUi).toHaveBeenCalledWith(
      expect.objectContaining({
        background: expect.objectContaining({ media_type: 'video', path: 'C:/background.mp4' }),
      })
    )
  })
})
