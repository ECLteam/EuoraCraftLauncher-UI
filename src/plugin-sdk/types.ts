// plugin-sdk 专属类型，/启动器数据类型统一从 @/types/api 导出

import type { MinecraftAccount } from '@/types/accounts'

export type CleanupFn = () => void

export interface PluginSdkContext {
  plugin: string
  version: string
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system'
  primaryColor: string
  backgroundImage: string
  backgroundOpacity: number
}

export interface ThemeState extends ThemeConfig {
  isDark: boolean
}

export type LauncherVersionType = 'alpha' | 'beta' | 'rc' | 'release'

export interface LauncherState {
  version: string
  versionType: LauncherVersionType
  devMode: boolean
}

export interface AccountState {
  current: MinecraftAccount | null
  list: MinecraftAccount[]
}

export interface SidebarState {
  collapsed: boolean
}

// 统一从领域类型文件重新导出常用数据类型，避免维护两份定义
export type {
  ApiResponse,
  JsonDict,
  BackendEvents,
  BackendEventName,
  CommandName,
  CommandPayloadMap,
  CommandResponseMap,
} from '@/types/api'
export type {
  MinecraftVersion,
  ScannedVersion,
  JavaInstallation,
  DownloadProgress,
  InstallProgress,
  LaunchProgress,
} from '@/types/instances'
export type {
  PluginInfo,
  PluginRoute,
  PluginSettingsData,
  PluginSettingSchema,
} from '@/types/plugins'
export type {
  ModItem,
  ModSearchItem,
  ModVersion,
  ResourcePack,
  ShaderPack,
  SaveEntry,
} from '@/types/mods'
export type {
  FsEntry,
  FileContent,
  PathInfo,
} from '@/types/system'
export type {
  SelectResult,
  ImageSelection,
  ImageDataUrl,
} from '@/types/accounts'
