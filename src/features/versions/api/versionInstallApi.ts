import backend from '@/api/client'
import type {
  CommandPayloadMap,
  InstallVersionResult,
  MinecraftVersionCatalog,
  ScannedVersion,
  SelectResult,
} from '@/types/api'

export type InstallableLoader = 'fabric' | 'forge' | 'neoforge' | 'quilt'

function assertSuccess<T>(result: { success: boolean; data?: T; message?: string }, operation: string): T {
  if (!result.success) throw new Error(result.message || `${operation}失败`)
  return result.data as T
}

export const versionInstallApi = {
  async getCatalog(): Promise<MinecraftVersionCatalog> {
    return assertSuccess(await backend.command('minecraft_versions_classified'), '获取版本列表')
  },

  async getLoaderVersions(loader: InstallableLoader, gameVersion: string): Promise<unknown> {
    const payload = { game_version: gameVersion }
    if (loader === 'fabric') return assertSuccess(await backend.command('fabric_versions', payload), '获取 Fabric 版本')
    if (loader === 'forge') return assertSuccess(await backend.command('forge_versions', payload), '获取 Forge 版本')
    if (loader === 'neoforge') {
      return assertSuccess(await backend.command('neoforge_versions', payload), '获取 NeoForge 版本')
    }
    return assertSuccess(await backend.command('quilt_versions', payload), '获取 Quilt 版本')
  },

  async scan(paths: string[]): Promise<ScannedVersion[]> {
    return assertSuccess(await backend.command('scan_versions', { path: paths }), '扫描本地版本') ?? []
  },

  async exists(path: string): Promise<boolean> {
    const result = await backend.command('fs_exists', { path })
    return assertSuccess(result, '检查版本目录').exists
  },

  async install(params: CommandPayloadMap['install_version']): Promise<InstallVersionResult> {
    return assertSuccess(await backend.command('install_version', params), '安装版本')
  },

  async uninstall(versionId: string, gamePath?: string): Promise<void> {
    assertSuccess(
      await backend.command('uninstall_version', { version_id: versionId, game_path: gamePath }),
      '卸载版本'
    )
  },

  async selectDirectory(): Promise<SelectResult | null> {
    return assertSuccess(await backend.command('select_directory'), '选择游戏目录') ?? null
  },

  async openFolder(path: string): Promise<void> {
    assertSuccess(await backend.command('open_folder', { path }), '打开目录')
  },
}
