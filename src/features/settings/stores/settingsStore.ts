import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import backend from '@/api/client'
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
}

async function resolveLocalImageUrl(path: string): Promise<string | null> {
  const fileUrl = await backend.file.toUrl(path).catch(() => null)
  if (fileUrl) return fileUrl
  return settingsApi.readImage(path)
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
    await patchUiBackground({ type: 'custom', path, mode: 'single' })
    return { path, imageUrl: await resolveLocalImageUrl(path) }
  }

  async function chooseBackgroundFolder(): Promise<{ path: string; files: string[]; firstImageUrl: string | null } | null> {
    const path = await settingsApi.selectDirectory()
    if (!path) return null
    const files = await settingsApi.listBackgroundImages(path)
    const firstImageUrl = files[0] ? await resolveLocalImageUrl(files[0]) : null
    await patchUiBackground({ type: 'custom', path, mode: 'carousel', interval: 10 })
    return { path, files, firstImageUrl }
  }

  async function saveRemoteBackground(url: string): Promise<{ path: string; imageUrl: string | null } | null> {
    const result = await settingsApi.saveImageUrl(url)
    if (!result) return null
    await patchUiBackground({ type: 'custom', path: result.url, mode: 'single', image_base64: result.dataUrl })
    return { path: result.url, imageUrl: result.dataUrl }
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
    chooseBackgroundFolder,
    saveRemoteBackground,
  }
})
