// plugin-sdk API 封装

import backend from '@/api/client'
import type {
  AccountListData,
  ConfigSection,
  FileContent,
  FsEntry,
  ImageDataUrl,
  ImageSelection,
  JavaInstallation,
  MinecraftAccount,
  MinecraftVersion,
  PathInfo,
  PluginInfo,
  PluginRoute,
  PluginSettingsSchema,
  ScannedVersion,
  SelectResult,
} from '@/types/api'
import type { ApiResponse, JsonDict } from './types'

// ── 插件命令 ──

export function callPluginCommand<T = unknown>(command: string, params?: JsonDict): Promise<ApiResponse<T>> {
  return backend.command('plugin_call_command', { command, params })
}

export const callCommand = callPluginCommand

// ── 插件设置 ──

export function getPluginSettings(pluginName: string): Promise<ApiResponse<PluginSettingsSchema>> {
  return backend.command('plugin_get_settings', { plugin_name: pluginName })
}

export const getSettings = getPluginSettings

export function updatePluginSetting(pluginName: string, key: string, value: unknown): Promise<ApiResponse<null>> {
  return backend.command('plugin_update_setting', { plugin_name: pluginName, key, value })
}

export const updateSetting = updatePluginSetting

// ── 插件路由 ──

export function getPluginRoutes(pluginId?: string): Promise<ApiResponse<PluginRoute[]>> {
  return backend.command('plugin_get_routes', { plugin_id: pluginId })
}

export const getRoutes = getPluginRoutes

// ── 启动器配置 ──

export function getLauncherConfig<T = JsonDict>(section: ConfigSection): Promise<ApiResponse<T>> {
  return backend.config.get<T>(section)
}

export const getConfig = getLauncherConfig

export function setLauncherConfig(section: ConfigSection, data: JsonDict): Promise<ApiResponse<null>> {
  return backend.config.set(section, data)
}

export const setConfig = setLauncherConfig

// ── 游戏版本 ──

export function getMinecraftVersions(filterType?: string): Promise<ApiResponse<MinecraftVersion[]>> {
  return backend.command('minecraft_versions', { filter_type: filterType })
}

export function scanGameVersions(path?: string | string[]): Promise<ApiResponse<ScannedVersion[]>> {
  return backend.command('scan_versions', { path })
}

export const scanVersions = scanGameVersions

export function installGameVersion(params: {
  version_id: string
  version_name?: string
  loader_type?: string
  task_id?: string
  fabric_version?: string
  forge_version?: string
  neoforge_version?: string
  optifine_version?: string
  optifine_type?: string
  optifine_patch?: string
  quilt_version?: string
  game_path?: string
  download_threads?: number
}): Promise<ApiResponse<void>> {
  return backend.command('install_version', params)
}

export const installVersion = installGameVersion

// ── Java ──

export function scanJavaInstallations(): Promise<ApiResponse<JavaInstallation[]>> {
  return backend.command('java_scan')
}

export const scanJava = scanJavaInstallations

export function getJavaInstallations(): Promise<ApiResponse<JavaInstallation[]>> {
  return backend.command('java_list')
}

export const getJavaList = getJavaInstallations

// ── 账户 ──

export function getAccountList(): Promise<ApiResponse<AccountListData>> {
  return backend.command('accounts_list')
}

export const getAccounts = getAccountList

export function getCurrentAccount(): Promise<ApiResponse<MinecraftAccount | null>> {
  return backend.command('accounts_current')
}

// ── 文件系统 ──

export function readDirectory(path: string): Promise<ApiResponse<FsEntry[]>> {
  return backend.fs.readDir(path)
}

export const readDir = readDirectory

export function readFileContent(path: string, mode?: 'text' | 'base64'): Promise<ApiResponse<FileContent>> {
  return backend.fs.readFile(path, mode)
}

export const readFile = readFileContent

export function checkPathExists(path: string): Promise<ApiResponse<PathInfo>> {
  return backend.fs.exists(path)
}

export const exists = checkPathExists

// ── 文件选择器 ──

export function selectDirectory(): Promise<ApiResponse<SelectResult>> {
  return backend.command('select_directory')
}

export function selectFile(): Promise<ApiResponse<SelectResult>> {
  return backend.command('select_file')
}

export function selectImage(): Promise<ApiResponse<ImageSelection>> {
  return backend.command('select_image')
}

export function openFolder(path: string): Promise<ApiResponse<void>> {
  return backend.command('open_folder', { path })
}

// ── 图片 ──

export function fetchImageDataUrl(url: string): Promise<ApiResponse<ImageDataUrl>> {
  return backend.command('image_fetch_data_url', { url })
}

// ── 插件信息 ──

export function getPluginList(): Promise<ApiResponse<PluginInfo[]>> {
  return backend.command('plugin_list')
}

export const getPlugins = getPluginList

export function getPluginInfo(pluginName: string): Promise<ApiResponse<PluginInfo>> {
  return backend.command('plugin_info', { plugin_name: pluginName })
}
