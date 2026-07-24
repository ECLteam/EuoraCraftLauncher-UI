type ShowcaseConfig = Record<string, unknown>

interface PersistedShowcaseConfig {
  version: 1
  config: ShowcaseConfig
}

export const SHOWCASE_CONFIG_STORAGE_KEY = 'euoracraft-launcher:showcase-config:v1'

function cloneSerializable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function mergePersistedValue(defaultValue: unknown, persistedValue: unknown): unknown {
  if (!isRecord(defaultValue) || !isRecord(persistedValue)) {
    return cloneSerializable(persistedValue)
  }

  const merged = cloneSerializable(defaultValue)
  for (const [key, value] of Object.entries(persistedValue)) {
    merged[key] = mergePersistedValue(merged[key], value)
  }
  return merged
}

function getStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export function loadShowcaseConfig(defaultConfig: ShowcaseConfig): ShowcaseConfig {
  const config = cloneSerializable(defaultConfig)
  const storage = getStorage()
  if (!storage) return config

  try {
    const raw = storage.getItem(SHOWCASE_CONFIG_STORAGE_KEY)
    if (!raw) return config

    const persisted = JSON.parse(raw) as unknown
    if (!isRecord(persisted) || persisted.version !== 1 || !isRecord(persisted.config)) {
      return config
    }

    for (const [section, value] of Object.entries(persisted.config)) {
      config[section] = mergePersistedValue(config[section], value)
    }
  } catch {
    return config
  }

  return config
}

export function persistShowcaseConfig(config: ShowcaseConfig): void {
  const storage = getStorage()
  if (!storage) return

  try {
    const payload: PersistedShowcaseConfig = {
      version: 1,
      config: cloneSerializable(config),
    }
    storage.setItem(SHOWCASE_CONFIG_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // 浏览器禁用存储或存储空间不足时，展示模式仍可继续使用内存配置。
  }
}
