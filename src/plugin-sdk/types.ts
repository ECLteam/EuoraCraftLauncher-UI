/**
 * plugin-sdk 通用类型定义
 * 插件开发者可直接引入使用，无需额外声明类型
 */

// ── API 响应 ──

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  timestamp?: number
}

// ── 插件元信息 ──

export interface PluginInfo {
  name: string
  version: string
  title: string
  description: string
  author: string
  icon: string
  status: string
  error: string | null
  is_system: boolean
}

// ── 配置 ──

export interface PluginSettingsSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'select'
    default: any
    label: string
    description?: string
    options?: { label: string; value: any }[]
  }
}

// ── 路由 ──

export interface PluginRoute {
  plugin: string
  path: string
  title: string
  icon: string
}

// ── 事件载荷 ──

export interface PluginEventPayload {
  plugin: string
  [key: string]: any
}

export interface PluginSettingsChangedPayload {
  plugin: string
  key: string
  old_value: any
  new_value: any
}

// ── 游戏相关 ──

export interface GameVersion {
  id: string
  type: string
  release_time: string
  url: string
}

export interface JavaInfo {
  path: string
  version: string
  arch: string
  vendor: string
}

export interface AccountInfo {
  id: string
  username: string
  type: 'offline' | 'microsoft'
  uuid?: string
  avatar_url?: string
}

// ── 模组相关 ──

export interface ModInfo {
  filename: string
  name: string
  version: string
  author: string
  loader_type: string
  game_version: string
  enabled: boolean
}

export interface OnlineModResult {
  id: string
  slug: string
  title: string
  description: string
  author: string
  icon_url: string
  downloads: number
  versions: string[]
  categories: string[]
  source: 'modrinth' | 'curseforge'
}

// ── 下载进度 ──

export interface DownloadProgress {
  filename: string
  total: number
  downloaded: number
  speed: number
  percent: number
  status: 'downloading' | 'completed' | 'error' | 'pending'
}

// ── 通用字典 ──

export type JsonDict = Record<string, any>