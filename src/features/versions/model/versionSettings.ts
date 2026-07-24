export interface VersionSettingsTarget {
  versionId: string
  path: string
}

export interface VersionLaunchSettings {
  isolated: boolean
  customMemory: boolean
  memory: number
  customJava: boolean
  javaPath: string
  jvmArgs: string
  gameArgs: string
}

export const DEFAULT_VERSION_SETTINGS: Readonly<VersionLaunchSettings> = {
  isolated: false,
  customMemory: false,
  memory: 4096,
  customJava: false,
  javaPath: '',
  jvmArgs: '',
  gameArgs: '',
}

export function createDefaultVersionSettings(): VersionLaunchSettings {
  return { ...DEFAULT_VERSION_SETTINGS }
}

export function createVersionSettingsKey(target: VersionSettingsTarget): string {
  const normalizedPath = target.path.trim().replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()
  return `${normalizedPath}::${target.versionId.trim()}`
}

export function normalizeVersionSettings(value: unknown): VersionLaunchSettings {
  if (!value || typeof value !== 'object') return createDefaultVersionSettings()
  const data = value as Partial<Record<keyof VersionLaunchSettings, unknown>>
  const parsedMemory = Number(data.memory)

  return {
    isolated: data.isolated === true,
    customMemory: data.customMemory === true,
    memory: Number.isFinite(parsedMemory) ? Math.min(65536, Math.max(512, Math.round(parsedMemory))) : 4096,
    customJava: data.customJava === true,
    javaPath: typeof data.javaPath === 'string' ? data.javaPath : '',
    jvmArgs: typeof data.jvmArgs === 'string' ? data.jvmArgs : '',
    gameArgs: typeof data.gameArgs === 'string' ? data.gameArgs : '',
  }
}

export function parseLaunchArguments(value: string): string[] {
  const args: string[] = []
  let current = ''
  let quote: '"' | "'" | null = null
  let escaped = false
  const input = value.trim()

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index] ?? ''
    if (escaped) {
      current += character
      escaped = false
      continue
    }
    if (character === '\\') {
      const next = input[index + 1]
      if (next && (next === '\\' || next === '"' || next === "'" || /\s/.test(next))) {
        escaped = true
      } else {
        current += character
      }
      continue
    }
    if (quote) {
      if (character === quote) quote = null
      else current += character
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      continue
    }
    if (/\s/.test(character)) {
      if (current) {
        args.push(current)
        current = ''
      }
      continue
    }
    current += character
  }

  if (escaped) current += '\\'
  if (current) args.push(current)
  return args
}
