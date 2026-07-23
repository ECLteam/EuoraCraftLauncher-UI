import backend from '@/api/client'
import type { DownloadConfig, GameConfig, JavaInstallation, UiConfig } from '@/types/api'

function assertSuccess<T>(result: { success: boolean; data?: T; message?: string }, operation: string): T {
  if (!result.success) {
    throw new Error(result.message || `${operation}失败`)
  }
  return result.data as T
}

export const settingsApi = {
  isAvailable: backend.runtime.isAvailable,
  isShowcase: backend.runtime.isShowcase,

  async load() {
    const result = await backend.config.getMany(['ui', 'game', 'download'])
    const data = assertSuccess(result, '读取设置')
    return {
      ui: (data.ui ?? {}) as UiConfig,
      game: (data.game ?? {}) as GameConfig,
      download: (data.download ?? {}) as DownloadConfig,
    }
  },

  async getUi(): Promise<UiConfig> {
    return assertSuccess(await backend.config.get<UiConfig>('ui'), '读取界面设置') ?? {}
  },

  async saveUi(config: UiConfig): Promise<void> {
    assertSuccess(await backend.config.set('ui', config), '保存界面设置')
  },

  async saveGame(config: GameConfig): Promise<void> {
    assertSuccess(await backend.config.set('game', config), '保存游戏设置')
  },

  async saveDownload(config: DownloadConfig): Promise<void> {
    assertSuccess(await backend.config.set('download', config), '保存下载设置')
  },

  async listJava(): Promise<JavaInstallation[]> {
    return assertSuccess(await backend.command('java_list'), '扫描 Java') ?? []
  },

  async selectJava(): Promise<string | null> {
    const result = await backend.command('select_java')
    if (!result.success) throw new Error(result.message || '选择 Java 失败')
    return result.data?.path ?? null
  },

  async selectImage(): Promise<string | null> {
    const result = await backend.command('select_image')
    if (!result.success) throw new Error(result.message || '选择图片失败')
    return result.data?.path ?? null
  },

  async saveImageUrl(url: string): Promise<string | null> {
    const result = await backend.command('image_save_url', { url })
    if (!result.success) throw new Error(result.message || '保存远程图片失败')
    return result.data?.path ?? null
  },

  async readImage(path: string): Promise<string | null> {
    const result = await backend.command('image_read_file', { path })
    if (!result.success) throw new Error(result.message || '读取图片失败')
    return result.data?.base64 || result.data?.dataUrl || null
  },
}
