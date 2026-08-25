import backend from '@/api/client'
import { unwrapResponse as assertSuccess } from '@/app/runtime/errorPresentation'
import type { EclPathConfig } from '@/types/config'

/**
 * 读取指定游戏路径下的 ecl.json。
 * 文件不存在或损坏时返回空对象。
 */
async function readConfig(gamePath: string): Promise<EclPathConfig> {
  const result = await backend.command('game_config_get', { game_path: gamePath })
  const data = assertSuccess(result, '读取 ecl.json')
  return (data ?? {}) as EclPathConfig
}

/**
 * 全量写入 ecl.json。
 */
async function writeConfig(gamePath: string, data: EclPathConfig): Promise<void> {
  const result = await backend.command('game_config_set', { game_path: gamePath, data })
  assertSuccess(result, '写入 ecl.json')
}

/**
 * 增量更新 ecl.json 中的字段，返回更新后的完整配置。
 */
async function patchConfig(gamePath: string, patch: Partial<EclPathConfig>): Promise<EclPathConfig> {
  const result = await backend.command('game_config_patch', {
    game_path: gamePath,
    patch: patch as Record<string, unknown>,
  })
  const data = assertSuccess(result, '更新 ecl.json')
  return (data ?? {}) as EclPathConfig
}

/**
 * 读取指定路径下的 activeVersion。
 */
async function getActiveVersion(gamePath: string): Promise<string | null> {
  const config = await readConfig(gamePath)
  const activeVersion = config.activeVersion || config.active_version || null
  if (activeVersion) confirmedActiveVersions.set(normalizePathKey(gamePath), activeVersion)
  return activeVersion
}

const pendingActiveVersionWrites = new Map<string, { versionId: string; promise: Promise<void> }>()
const confirmedActiveVersions = new Map<string, string>()

function normalizePathKey(gamePath: string): string {
  return gamePath
    .trim()
    .replace(/[\\/]+$/, '')
    .replace(/\\/g, '/')
    .toLowerCase()
}

/**
 * 设置指定路径下的 activeVersion。
 */
async function setActiveVersion(gamePath: string, versionId: string): Promise<void> {
  const key = normalizePathKey(gamePath)
  const pending = pendingActiveVersionWrites.get(key)
  if (pending?.versionId === versionId) return pending.promise
  if (!pending && confirmedActiveVersions.get(key) === versionId) return

  const promise = (async () => {
    if (pending) await pending.promise.catch(() => undefined)
    await patchConfig(gamePath, { activeVersion: versionId })
    confirmedActiveVersions.set(key, versionId)
  })()
  pendingActiveVersionWrites.set(key, { versionId, promise })
  try {
    await promise
  } finally {
    if (pendingActiveVersionWrites.get(key)?.promise === promise) pendingActiveVersionWrites.delete(key)
  }
}

export const instancePathConfigApi = {
  readConfig,
  writeConfig,
  patchConfig,
  getActiveVersion,
  setActiveVersion,
}
