import backend from '@/api/client'
import type {
  CommandPayloadMap,
  InstallVersionResult,
  MinecraftVersionCatalog,
  ScannedVersion,
  SelectResult,
} from '@/types/api'

export type InstallableLoader = 'fabric' | 'forge' | 'neoforge' | 'quilt'
export type VersionsChangedHandler = (payload: { gamePath: string }) => void

const scanCache = new Map<string, ScannedVersion[]>()
const versionsChangedHandlers = new Set<VersionsChangedHandler>()
let isListeningForVersionChanges = false

function assertSuccess<T>(result: { success: boolean; data?: T; message?: string }, operation: string): T {
  if (!result.success) throw new Error(result.message || `${operation}失败`)
  return result.data as T
}

export function normalizeGamePath(path: string): string {
  return path.trim().replace(/[\\/]+/g, '/').replace(/\/$/, '').toLocaleLowerCase()
}

function cloneVersions(versions: ScannedVersion[]): ScannedVersion[] {
  return versions.map((version) => ({ ...version }))
}

function invalidateScanCache(path?: string): void {
  if (path) {
    scanCache.delete(normalizeGamePath(path))
  } else {
    scanCache.clear()
  }
}

function ensureVersionChangeListener(): void {
  if (isListeningForVersionChanges) return
  isListeningForVersionChanges = true
  backend.on('game:versions_changed', (payload) => {
    invalidateScanCache(payload.gamePath)
    versionsChangedHandlers.forEach((handler) => handler(payload))
  })
}

export const instanceInstallApi = {
  async getCatalog(): Promise<MinecraftVersionCatalog> {
    return assertSuccess(await backend.command('game_versions', { classified: true }), '获取实例列表') as MinecraftVersionCatalog
  },

  async getLoaderVersions(loader: InstallableLoader, gameVersion: string): Promise<string[]> {
    return assertSuccess(
      await backend.command('game_loader_versions', { loader, game_version: gameVersion }),
      `获取 ${loader} 版本`
    )
  },

  async scan(paths: string[], options: { force?: boolean } = {}): Promise<ScannedVersion[]> {
    ensureVersionChangeListener()
    const requestedPaths = [...new Set(paths.filter((path) => path.trim()))]
    if (options.force) requestedPaths.forEach((path) => invalidateScanCache(path))

    const missingPaths = requestedPaths.filter((path) => !scanCache.has(normalizeGamePath(path)))
    if (missingPaths.length > 0) {
      const scanned =
        assertSuccess(
          await backend.command('game_scan', { paths: missingPaths, force: options.force || undefined }),
          '扫描本地实例'
        ) ?? []
      const missingKeys = new Set(missingPaths.map(normalizeGamePath))
      missingKeys.forEach((key) => scanCache.set(key, []))
      scanned.forEach((version) => {
        const fallbackPath = missingPaths.length === 1 ? (missingPaths[0] ?? '') : ''
        const key = normalizeGamePath(version.path || fallbackPath)
        if (!missingKeys.has(key)) return
        scanCache.get(key)?.push({ ...version })
      })
    }

    return requestedPaths.flatMap((path) => cloneVersions(scanCache.get(normalizeGamePath(path)) ?? []))
  },

  invalidateScanCache,

  onVersionsChanged(handler: VersionsChangedHandler): () => void {
    ensureVersionChangeListener()
    versionsChangedHandlers.add(handler)
    return () => versionsChangedHandlers.delete(handler)
  },

  async exists(path: string): Promise<boolean> {
    const result = await backend.command('fs_exists', { path })
    return assertSuccess(result, '检查实例目录').exists
  },

  async install(params: CommandPayloadMap['game_install']): Promise<InstallVersionResult> {
    const result = assertSuccess(await backend.command('game_install', params), '安装实例')
    if (params.game_path) invalidateScanCache(params.game_path)
    return result
  },

  async uninstall(versionId: string, gamePath: string): Promise<void> {
    assertSuccess(
      await backend.command('game_uninstall', { version_id: versionId, game_path: gamePath }),
      '卸载实例'
    )
    invalidateScanCache(gamePath)
  },

  async selectDirectory(): Promise<SelectResult | null> {
    return assertSuccess(await backend.command('select_directory'), '选择目录') ?? null
  },

  async openFolder(path: string): Promise<void> {
    assertSuccess(await backend.command('open_folder', { path }), '打开目录')
  },
}
