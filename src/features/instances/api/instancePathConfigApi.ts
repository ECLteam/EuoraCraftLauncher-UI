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

function activeVersionFromConfig(config: EclPathConfig): string | null {
  return config.activeVersion || config.active_version || null
}

function cacheActiveVersion(key: string, config: EclPathConfig, generation: number): void {
  if ((activeVersionCacheGeneration.get(key) ?? 0) !== generation) return
  activeVersions.set(key, activeVersionFromConfig(config))
}

function nextActiveVersionCacheGeneration(key: string): number {
  const generation = (activeVersionCacheGeneration.get(key) ?? 0) + 1
  activeVersionCacheGeneration.set(key, generation)
  activeVersions.delete(key)
  return generation
}

/**
 * 全量写入 ecl.json。
 */
async function writeConfig(gamePath: string, data: EclPathConfig): Promise<void> {
  const key = normalizePathKey(gamePath)
  const generation = nextActiveVersionCacheGeneration(key)
  const result = await backend.command('game_config_set', { game_path: gamePath, data })
  assertSuccess(result, '写入 ecl.json')
  cacheActiveVersion(key, data, generation)
}

/**
 * 增量更新 ecl.json 中的字段，返回更新后的完整配置。
 */
async function patchConfig(gamePath: string, patch: Partial<EclPathConfig>): Promise<EclPathConfig> {
  const key = normalizePathKey(gamePath)
  const generation = nextActiveVersionCacheGeneration(key)
  const result = await backend.command('game_config_patch', {
    game_path: gamePath,
    patch: patch as Record<string, unknown>,
  })
  const data = assertSuccess(result, '更新 ecl.json')
  const config = (data ?? {}) as EclPathConfig
  cacheActiveVersion(key, config, generation)
  return config
}

/**
 * 读取指定路径下的 activeVersion。
 */
async function getActiveVersion(gamePath: string, options: { force?: boolean } = {}): Promise<string | null> {
  const key = normalizePathKey(gamePath)
  const force = options.force ?? false
  if (!force && activeVersions.has(key)) return activeVersions.get(key) ?? null

  const pending = pendingActiveVersionReads.get(key)
  if (!force && pending) return pending.promise
  if (force && pending?.force) return pending.promise

  const generation = force ? nextActiveVersionCacheGeneration(key) : (activeVersionCacheGeneration.get(key) ?? 0)
  const promise = readConfig(gamePath).then((config) => {
    cacheActiveVersion(key, config, generation)
    return activeVersionFromConfig(config)
  })
  const entry = { promise, force }
  pendingActiveVersionReads.set(key, entry)
  const removePending = () => {
    if (pendingActiveVersionReads.get(key) === entry) pendingActiveVersionReads.delete(key)
  }
  void promise.then(removePending, removePending)
  return promise
}

const pendingActiveVersionReads = new Map<string, { promise: Promise<string | null>; force: boolean }>()
const pendingActiveVersionWrites = new Map<string, { versionId: string; promise: Promise<void> }>()
const activeVersions = new Map<string, string | null>()
const activeVersionCacheGeneration = new Map<string, number>()

function normalizePathKey(gamePath: string): string {
  return gamePath
    .trim()
    .replace(/[\\/]+$/, '')
    .replace(/\\/g, '/')
    .toLowerCase()
}

/**
 * 失效指定路径或全部路径的 activeVersion 会话缓存。
 */
function invalidateActiveVersionCache(gamePath?: string): void {
  const keys = gamePath
    ? [normalizePathKey(gamePath)]
    : new Set([...activeVersions.keys(), ...pendingActiveVersionReads.keys(), ...activeVersionCacheGeneration.keys()])
  for (const key of keys) nextActiveVersionCacheGeneration(key)
}

/**
 * 设置指定路径下的 activeVersion。
 */
async function setActiveVersion(gamePath: string, versionId: string): Promise<void> {
  const key = normalizePathKey(gamePath)
  const pending = pendingActiveVersionWrites.get(key)
  if (pending?.versionId === versionId) return pending.promise
  if (!pending && activeVersions.get(key) === versionId) return

  const promise = (async () => {
    if (pending) await pending.promise.catch(() => undefined)
    await patchConfig(gamePath, { activeVersion: versionId })
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
  invalidateActiveVersionCache,
  setActiveVersion,
}
