import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { settingsApi } from '@/features/settings/api/settingsApi'
import type { DownloadConfig, GameConfig, UiConfig } from '@/types/api'

const DEFAULT_GAME_CONFIG: GameConfig = {
  minecraft_paths: [],
  java_auto: true,
  java_path: '',
  memory_auto: true,
  memory_size: 4096,
  fullscreen: false,
}

const DEFAULT_DOWNLOAD_CONFIG: DownloadConfig = {
  mirror_source: 'official',
  download_threads: 8,
}

export const useSettingsStore = defineStore('settings', () => {
  const ui = ref<UiConfig>({})
  const game = ref<GameConfig>({ ...DEFAULT_GAME_CONFIG })
  const download = ref<DownloadConfig>({ ...DEFAULT_DOWNLOAD_CONFIG })
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const error = ref('')
  let loadPromise: Promise<void> | null = null

  const isLoading = computed(() => status.value === 'loading')

  async function load(force = false): Promise<void> {
    if (!force && status.value === 'ready') return
    if (!force && loadPromise) return loadPromise
    status.value = 'loading'
    error.value = ''
    loadPromise = (async () => {
      try {
        const config = await settingsApi.load()
        ui.value = config.ui
        game.value = { ...DEFAULT_GAME_CONFIG, ...config.game }
        download.value = { ...DEFAULT_DOWNLOAD_CONFIG, ...config.download }
        status.value = 'ready'
      } catch (reason) {
        status.value = 'error'
        error.value = reason instanceof Error ? reason.message : '读取设置失败'
        throw reason
      } finally {
        loadPromise = null
      }
    })()
    return loadPromise
  }

  async function ensureReady(): Promise<void> {
    if (status.value !== 'ready') await load()
  }

  async function patchUi(patch: Partial<UiConfig>): Promise<void> {
    await ensureReady()
    const next = { ...ui.value, ...patch }
    await settingsApi.saveUi(next)
    ui.value = next
  }

  async function patchUiTheme(patch: NonNullable<UiConfig['theme']>): Promise<void> {
    await patchUi({ theme: { ...ui.value.theme, ...patch } })
  }

  async function patchUiBackground(patch: NonNullable<UiConfig['background']>): Promise<void> {
    await patchUi({ background: { ...ui.value.background, ...patch } })
  }

  async function patchGame(patch: Partial<GameConfig>): Promise<void> {
    await ensureReady()
    const next = { ...game.value, ...patch }
    await settingsApi.saveGame(next)
    game.value = next
  }

  async function patchDownload(patch: Partial<DownloadConfig>): Promise<void> {
    await ensureReady()
    const next = { ...download.value, ...patch }
    await settingsApi.saveDownload(next)
    download.value = next
  }

  async function chooseBackgroundImage(): Promise<{ path: string; imageUrl: string | null } | null> {
    const path = await settingsApi.selectImage()
    if (!path) return null
    await patchUiBackground({ type: 'custom', path })
    return { path, imageUrl: await settingsApi.readImage(path) }
  }

  async function saveRemoteBackground(url: string): Promise<{ path: string; imageUrl: string | null } | null> {
    const path = await settingsApi.saveImageUrl(url)
    if (!path) return null
    await patchUiBackground({ type: 'custom', path })
    return { path, imageUrl: await settingsApi.readImage(path) }
  }

  return {
    ui,
    game,
    download,
    status,
    error,
    isLoading,
    load,
    patchUi,
    patchUiTheme,
    patchUiBackground,
    patchGame,
    patchDownload,
    chooseBackgroundImage,
    saveRemoteBackground,
  }
})
