import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { resolveLocalImageUrl, settingsApi } from '@/features/settings/api/settingsApi'
import type { DownloadConfig, GameConfig, LauncherConfig, UiConfig } from '@/types/api'

const DEFAULT_GAME_CONFIG: GameConfig = {
  minecraft_paths: [],
  java_auto: true,
  java_path: '',
  memory_auto: true,
  memory_size: 4096,
  fullscreen: false,
  active_path: '',
}

const DEFAULT_DOWNLOAD_CONFIG: DownloadConfig = {
  mirror_source: 'official',
}

export const useSettingsStore = defineStore('settings', () => {
  const ui = ref<UiConfig>({})
  const game = ref<GameConfig>({ ...DEFAULT_GAME_CONFIG })
  const download = ref<DownloadConfig>({ ...DEFAULT_DOWNLOAD_CONFIG })
  const launcher = ref<LauncherConfig>({
    debug: false,
    disable_ssl_verify: false,
    proxy_mode: 'none',
    proxy_url: '',
    request_timeout: 15,
    request_retries: 2,
  })
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const error = ref('')
  let loadPromise: Promise<void> | null = null
  let latestLoadId = 0
  let configRevision = 0
  const writeQueues = new Map<string, Promise<void>>()

  const isLoading = computed(() => status.value === 'loading')

  async function load(force = false): Promise<void> {
    if (!force && status.value === 'ready') return
    if (!force && loadPromise) return loadPromise
    const loadId = ++latestLoadId
    const revisionAtStart = configRevision
    status.value = 'loading'
    error.value = ''
    const request: Promise<void> = (async () => {
      try {
        const config = await settingsApi.load()
        // 读取期间若已有本地写入完成，旧快照不能覆盖新状态。
        if (loadId !== latestLoadId || revisionAtStart !== configRevision) return
        ui.value = config.ui
        game.value = { ...DEFAULT_GAME_CONFIG, ...config.game }
        download.value = { ...DEFAULT_DOWNLOAD_CONFIG, ...config.download }
        launcher.value = { ...config.launcher }
        status.value = 'ready'
      } catch (reason) {
        if (loadId === latestLoadId) {
          status.value = 'error'
          error.value = reason instanceof Error ? reason.message : '读取设置失败'
        }
        throw reason
      } finally {
        if (loadId === latestLoadId) loadPromise = null
      }
    })()
    loadPromise = request
    return request
  }

  /**
   * 同一配置区的“读取当前值 → 合并 → 写回”必须串行执行，避免并发局部更新互相覆盖。
   */
  function enqueueWrite<T>(section: string, action: () => Promise<T>): Promise<T> {
    const previous = writeQueues.get(section) ?? Promise.resolve()
    const request = previous.catch(() => undefined).then(action)
    writeQueues.set(
      section,
      request.then(
        () => undefined,
        () => undefined
      )
    )
    return request
  }

  async function ensureReady(): Promise<void> {
    if (status.value !== 'ready') await load()
  }

  async function patchUi(patch: Partial<UiConfig>): Promise<void> {
    await enqueueWrite('ui', async () => {
      await ensureReady()
      const next = { ...ui.value, ...patch }
      await settingsApi.saveUi(next)
      ui.value = next
      configRevision += 1
    })
  }

  async function patchUiTheme(patch: NonNullable<UiConfig['theme']>): Promise<void> {
    await enqueueWrite('ui', async () => {
      await ensureReady()
      const next = { ...ui.value, theme: { ...ui.value.theme, ...patch } }
      await settingsApi.saveUi(next)
      ui.value = next
      configRevision += 1
    })
  }

  async function patchUiBackground(patch: NonNullable<UiConfig['background']>): Promise<void> {
    await enqueueWrite('ui', async () => {
      await ensureReady()
      const next = { ...ui.value, background: { ...ui.value.background, ...patch } }
      await settingsApi.saveUi(next)
      ui.value = next
      configRevision += 1
    })
  }

  async function patchGame(patch: Partial<GameConfig>): Promise<void> {
    await enqueueWrite('game', async () => {
      await ensureReady()
      const next = { ...game.value, ...patch }
      await settingsApi.saveGame(next)
      game.value = next
      configRevision += 1
    })
  }

  async function patchLauncher(patch: Partial<LauncherConfig>): Promise<void> {
    await enqueueWrite('launcher', async () => {
      await ensureReady()
      const next = { ...launcher.value, ...patch }
      await settingsApi.saveLauncher(next)
      launcher.value = next
      configRevision += 1
    })
  }

  async function patchDownload(patch: Partial<DownloadConfig>): Promise<void> {
    await enqueueWrite('download', async () => {
      await ensureReady()
      const next = { ...download.value, ...patch }
      await settingsApi.saveDownload(next)
      download.value = next
      configRevision += 1
    })
  }

  async function chooseBackgroundImage(): Promise<{ path: string; imageUrl: string | null } | null> {
    const path = await settingsApi.selectImage()
    if (!path) return null
    await patchUiBackground({ type: 'custom', path, mode: 'single' })
    return { path, imageUrl: await resolveLocalImageUrl(path) }
  }

  async function saveRemoteBackground(url: string): Promise<{ path: string; imageUrl: string | null } | null> {
    const result = await settingsApi.saveImageUrl(url)
    if (!result) return null
    // 后端已将图片落盘到本地数据目录，配置只存路径，不再保存大体积 base64
    const localPath = result.path || result.url
    await patchUiBackground({ type: 'custom', path: localPath, mode: 'single', image_base64: '' })
    return { path: localPath, imageUrl: result.dataUrl }
  }

  return {
    ui,
    game,
    download,
    launcher,
    status,
    error,
    isLoading,
    load,
    patchUi,
    patchUiTheme,
    patchUiBackground,
    patchGame,
    patchLauncher,
    patchDownload,
    chooseBackgroundImage,
    saveRemoteBackground,
  }
})
