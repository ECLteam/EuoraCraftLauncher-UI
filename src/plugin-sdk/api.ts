// plugin-sdk API 封装

import backend from '@/api/client'
import type {
  AccountListData,
  ApiResponse,
  ConfigSection,
  FileContent,
  FsEntry,
  ImageDataUrl,
  ImageSelection,
  JavaInstallation,
  JsonDict,
  MinecraftAccount,
  MinecraftVersion,
  PathInfo,
  PluginInfo,
  PluginRoute,
  PluginSettingsSchema,
  ScannedVersion,
  SelectResult,
} from '@/types/api'

// ── 插件命令 ──

/**
 * 调用插件暴露的命令。
 * @param command - 命令名称
 * @param params - 命令参数
 * @returns 插件命令返回结果
 */
export function callPluginCommand<T = unknown>(command: string, params?: JsonDict): Promise<ApiResponse<T>> {
  return backend.command('plugin_call_command', { command, params }) as Promise<ApiResponse<T>>
}

// ── 插件设置 ──

/**
 * 获取插件的设置定义。
 * @param pluginName - 插件名称
 */
export function getPluginSettings(pluginName: string): Promise<ApiResponse<PluginSettingsSchema>> {
  return backend.command('plugin_get_settings', { plugin_name: pluginName })
}

/**
 * 更新插件设置项。
 * @param pluginName - 插件名称
 * @param key - 设置键
 * @param value - 设置值
 */
export function updatePluginSetting(pluginName: string, key: string, value: unknown): Promise<ApiResponse<void>> {
  return backend.command('plugin_update_setting', { plugin_name: pluginName, key, value })
}

// ── 插件路由 ──

/**
 * 获取已注册插件路由列表。
 * @param pluginId - 可选的插件 ID 过滤
 */
export function getPluginRoutes(pluginId?: string): Promise<ApiResponse<PluginRoute[]>> {
  return backend.command('plugin_get_routes', { plugin_id: pluginId })
}

// ── 启动器配置 ──

/**
 * 获取启动器配置节。
 * @param section - 配置节名称
 */
export function getLauncherConfig<T = JsonDict>(section: ConfigSection): Promise<ApiResponse<T>> {
  return backend.config.get<T>(section)
}

/**
 * 设置启动器配置节。
 * @param section - 配置节名称
 * @param data - 配置数据
 */
export function setLauncherConfig(section: ConfigSection, data: JsonDict): Promise<ApiResponse<void>> {
  return backend.config.set(section, data)
}

// ── 游戏版本 ──

/**
 * 获取 Minecraft 版本列表。
 * @param filterType - 版本过滤类型
 */
export function getMinecraftVersions(filterType?: string): Promise<ApiResponse<MinecraftVersion[]>> {
  return backend.command('minecraft_versions', { filter_type: filterType })
}

/**
 * 扫描指定路径下的游戏版本。
 * @param path - 游戏路径，支持单个或多个路径
 */
export function scanGameVersions(path?: string | string[]): Promise<ApiResponse<ScannedVersion[]>> {
  return backend.command('scan_versions', { path })
}

/**
 * 安装游戏版本。
 * @param params - 安装参数，包括版本 ID、加载器、任务 ID 等
 */
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

// ── Java ──

/**
 * 扫描系统中的 Java 安装。
 */
export function scanJavaInstallations(): Promise<ApiResponse<JavaInstallation[]>> {
  return backend.command('java_scan')
}

/**
 * 获取已记录的 Java 安装列表。
 */
export function getJavaInstallations(): Promise<ApiResponse<JavaInstallation[]>> {
  return backend.command('java_list')
}

// ── 账户 ──

/**
 * 获取账户列表。
 */
export function getAccountList(): Promise<ApiResponse<AccountListData>> {
  return backend.command('accounts_list')
}

/**
 * 获取当前选中的账户。
 */
export function getCurrentAccount(): Promise<ApiResponse<MinecraftAccount | null>> {
  return backend.command('accounts_current')
}

// ── 文件系统 ──

/**
 * 读取目录内容。
 * @param path - 目录路径
 */
export function readDirectory(path: string): Promise<ApiResponse<FsEntry[]>> {
  return backend.fs.readDir(path)
}

/**
 * 读取文件内容。
 * @param path - 文件路径
 * @param mode - 读取模式，text 或 base64
 */
export function readFileContent(path: string, mode?: 'text' | 'base64'): Promise<ApiResponse<FileContent>> {
  return backend.fs.readFile(path, mode)
}

/**
 * 检查路径是否存在。
 * @param path - 路径
 */
export function checkPathExists(path: string): Promise<ApiResponse<PathInfo>> {
  return backend.fs.exists(path)
}

// ── 文件选择器 ──

/**
 * 打开目录选择对话框。
 */
export function selectDirectory(): Promise<ApiResponse<SelectResult>> {
  return backend.command('select_directory')
}

/**
 * 打开文件选择对话框。
 */
export function selectFile(): Promise<ApiResponse<SelectResult>> {
  return backend.command('select_file')
}

/**
 * 打开图片选择对话框。
 */
export function selectImage(): Promise<ApiResponse<ImageSelection>> {
  return backend.command('select_image')
}

/**
 * 使用系统默认程序打开文件夹。
 * @param path - 文件夹路径
 */
export function openFolder(path: string): Promise<ApiResponse<void>> {
  return backend.command('open_folder', { path })
}

// ── 图片 ──

/**
 * 将图片 URL 转换为 Data URL。
 * @param url - 图片 URL
 */
export function fetchImageDataUrl(url: string): Promise<ApiResponse<ImageDataUrl>> {
  return backend.command('image_fetch_data_url', { url })
}

// ── 插件信息 ──

/**
 * 获取所有插件信息。
 */
export function getPluginList(): Promise<ApiResponse<PluginInfo[]>> {
  return backend.command('plugin_list')
}

/**
 * 获取单个插件信息。
 * @param pluginName - 插件名称
 */
export function getPluginInfo(pluginName: string): Promise<ApiResponse<PluginInfo>> {
  return backend.command('plugin_info', { plugin_name: pluginName })
}
