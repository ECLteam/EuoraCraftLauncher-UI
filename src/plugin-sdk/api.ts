/**
 * plugin-sdk API 封装
 * 提供类型安全的统一 API 调用接口，插件开发者通过此模块与后端交互。
 * 所有调用都走统一的 backend.command() → exec_action → 后端分发的路径。
 */

import backend from '@/api/client'
import type { ApiResponse, JsonDict } from './types'

// ── 插件命令调用（统一入口） ──

/**
 * 调用任意插件注册的命令（含系统插件命令）。
 * 命令名格式: "plugin_name:command_name"
 */
export function callCommand<T = any>(command: string, params?: JsonDict): Promise<ApiResponse<T>> {
  return backend.command('plugin_call_command', { command, params })
}

// ── 插件设置 ──

/** 获取当前插件的设置 */
export function getSettings(pluginName: string): Promise<ApiResponse<JsonDict>> {
  return backend.command('plugin_get_settings', { plugin_name: pluginName })
}

/** 更新当前插件的某项设置 */
export function updateSetting(pluginName: string, key: string, value: unknown): Promise<ApiResponse<null>> {
  return backend.command('plugin_update_setting', { plugin_name: pluginName, key, value })
}

// ── 插件路由 ──

/** 获取所有已注册的插件路由 */
export function getRoutes(pluginId?: string): Promise<ApiResponse<any[]>> {
  return backend.command('plugin_get_routes', { plugin_id: pluginId })
}

// ── 配置读写 ──

/** 读取启动器配置 */
export function getConfig<T = JsonDict>(section: string): Promise<ApiResponse<T>> {
  return backend.config.get<T>(section)
}

/** 写入启动器配置 */
export function setConfig(section: string, data: JsonDict): Promise<ApiResponse<null>> {
  return backend.config.set(section, data)
}

// ── 游戏相关 ──

/** 获取 Minecraft 版本列表 */
export function getMinecraftVersions(filterType?: string): Promise<ApiResponse<any[]>> {
  return backend.command('minecraft_versions', { filter_type: filterType })
}

/** 扫描游戏目录中的版本 */
export function scanVersions(path?: string | string[]): Promise<ApiResponse<any[]>> {
  return backend.command('scan_versions', { path })
}

/** 安装游戏版本 */
export function installVersion(params: {
  version_id: string
  loader_type?: string
  fabric_version?: string
  game_path?: string
}): Promise<ApiResponse<any>> {
  return backend.command('install_version', params)
}

// ── Java 相关 ──

/** 扫描系统中的 Java 运行时 */
export function scanJava(): Promise<ApiResponse<any[]>> {
  return backend.command('java_scan')
}

/** 获取已保存的 Java 列表 */
export function getJavaList(): Promise<ApiResponse<any[]>> {
  return backend.command('java_list')
}

// ── 账户相关 ──

/** 获取账户列表 */
export function getAccounts(): Promise<ApiResponse<any[]>> {
  return backend.command('accounts_list')
}

/** 获取当前账户 */
export function getCurrentAccount(): Promise<ApiResponse<any>> {
  return backend.command('accounts_current')
}

// ── 文件系统 ──

/** 读取目录内容 */
export function readDir(path: string): Promise<ApiResponse<{ name: string; is_dir: boolean; size: number; mtime: number }[]>> {
  return backend.fs.readDir(path)
}

/** 读取文件 */
export function readFile(path: string, mode?: 'text' | 'base64'): Promise<ApiResponse<{ content: string; size: number }>> {
  return backend.fs.readFile(path, mode)
}

/** 检查路径是否存在 */
export function exists(path: string): Promise<ApiResponse<{ exists: boolean; is_dir: boolean; is_file: boolean }>> {
  return backend.fs.exists(path)
}

// ── 文件选择器 ──

/** 打开目录选择器 */
export function selectDirectory(): Promise<ApiResponse<{ path: string }>> {
  return backend.command('select_directory')
}

/** 打开文件选择器 */
export function selectImage(): Promise<ApiResponse<{ path: string }>> {
  return backend.command('select_image')
}

// ── 事件订阅 ──

/**
 * 监听后端事件。
 * 返回取消监听的函数。
 */
export function onEvent(event: string, callback: (payload: any) => void): () => void {
  return backend.on(event, callback)
}

/** 取消事件监听 */
export function offEvent(event: string, callback?: (payload: any) => void): void {
  backend.off(event, callback)
}