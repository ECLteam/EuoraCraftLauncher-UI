import backend from '@/api/client'
import { unwrapResponse as assertSuccess } from '@/app/runtime/errorPresentation'
import {
  createVersionSettingsKey,
  normalizeVersionSettings,
  type VersionLaunchSettings,
  type VersionSettingsTarget,
} from '@/features/instances/model/instanceSettings'

const VERSION_SETTINGS_SECTION = 'version_settings'

type StoredVersionSettings = Record<string, VersionLaunchSettings>

async function getStoredSettings(): Promise<StoredVersionSettings> {
  const result = await backend.config.get<StoredVersionSettings>(VERSION_SETTINGS_SECTION)
  return assertSuccess(result, '读取实例设置') ?? {}
}

export const instanceSettingsApi = {
  async get(target: VersionSettingsTarget): Promise<VersionLaunchSettings> {
    const settings = await getStoredSettings()
    return normalizeVersionSettings(settings[createVersionSettingsKey(target)])
  },

  async save(target: VersionSettingsTarget, value: VersionLaunchSettings): Promise<void> {
    const settings = await getStoredSettings()
    settings[createVersionSettingsKey(target)] = normalizeVersionSettings(value)
    assertSuccess(await backend.config.set(VERSION_SETTINGS_SECTION, settings), '保存实例设置')
  },

  async reset(target: VersionSettingsTarget): Promise<void> {
    const settings = await getStoredSettings()
    delete settings[createVersionSettingsKey(target)]
    assertSuccess(await backend.config.set(VERSION_SETTINGS_SECTION, settings), '重置实例设置')
  },

  async selectJava(): Promise<string | null> {
    const result = await backend.command('select_java')
    return assertSuccess(result, '选择 Java')?.path ?? null
  },
}
