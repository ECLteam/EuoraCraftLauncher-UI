// plugin-sdk 专属类型，游戏/启动器数据类型统一从 @/types/api 导出

export type CleanupFn = () => void

export interface PluginSdkContext {
  plugin: string
  version: string
}

export interface ThemeState {
  mode: 'light' | 'dark' | 'system'
  isDark: boolean
  primaryColor: string
  backgroundImage: string
  backgroundOpacity: number
}

export interface LauncherState {
  version: string
  versionType: string
  devMode: boolean
}

export interface AccountState {
  current: import('@/types/api').MinecraftAccount | null
  list: import('@/types/api').MinecraftAccount[]
}

// 统一从 @/types/api 重新导出常用数据类型，避免维护两份定义
export type {
  ApiResponse,
  MinecraftVersion,
  ScannedVersion,
  JavaInstallation,
  MinecraftAccount,
  AccountListData,
  PluginInfo,
  PluginRoute,
  PluginSettingsSchema,
  ModItem,
  ModSearchItem,
  ModVersion,
  ResourcePack,
  ShaderPack,
  SaveEntry,
  FsEntry,
  FileContent,
  PathInfo,
  SelectResult,
  ImageSelection,
  ImageDataUrl,
  DownloadProgress,
  InstallProgress,
  LaunchProgress,
  BackendEvents,
  BackendEventName,
  CommandName,
  CommandPayloadMap,
  CommandResponseMap,
} from '@/types/api'
