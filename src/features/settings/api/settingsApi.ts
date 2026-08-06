import backend from '@/api/client'
import type {
  DownloadConfig,
  GameConfig,
  ImageSaveAsPayload,
  ImageSaveUrlResult,
  JavaInstallation,
  SystemMemoryInfo,
  UiConfig,
} from '@/types/api'

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

  async getSystemMemory(): Promise<SystemMemoryInfo> {
    return assertSuccess(await backend.command('system_memory'), '读取系统内存') ?? {
      totalMb: 16384,
      usedMb: 4096,
      freeMb: 12288,
      percentUsed: 25,
    }
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

  async selectDirectory(): Promise<string | null> {
    const result = await backend.command('select_directory')
    if (!result.success) throw new Error(result.message || '选择文件夹失败')
    return result.data?.path ?? null
  },

  async listBackgroundImages(path: string): Promise<string[]> {
    const result = await backend.command('image_list_files', { path })
    if (!result.success) throw new Error(result.message || '读取图片列表失败')
    return result.data?.files ?? []
  },

  async saveImageUrl(url: string): Promise<ImageSaveUrlResult | null> {
    const result = await backend.command('image_save_url', { url })
    if (!result.success) throw new Error(result.message || '保存远程图片失败')
    return result.data ?? null
  },

  async saveImageAs(payload: ImageSaveAsPayload): Promise<string | null> {
    const result = await backend.command('image_save_as', payload)
    if (!result.success) throw new Error(result.message || '保存图片失败')
    return result.data?.path ?? null
  },

  async readImage(path: string): Promise<string | null> {
    const result = await backend.command('image_read_file', { path })
    if (!result.success) throw new Error(result.message || '读取图片失败')
    const data = result.data ?? {}
    if (data.dataUrl) {
      return data.dataUrl
    }
    if (data.base64) {
      return `data:image/png;base64,${data.base64}`
    }
    return null
  },
}
