/**
 * 前端定义的数据结构。
 *
 * 后端不关心这些字段的具体含义，只负责存/取 JSON。
 * 社区替换前端时，可以自由增删字段，不需要改后端代码。
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errorCode?: string
  timestamp?: number
}

// ── 应用配置 ──────────────────────────────────────────────────────

export interface LauncherConfig {
  version: string
  version_type: 'dev' | 'beta' | 'release'
  debug: boolean
}

export interface BackgroundConfig {
  type: 'default' | 'local' | 'url' | 'gradient'
  path: string
  opacity: number
  blur: number
  image_base64?: string
}

export interface GameConfig {
  minecraft_paths: (string | { name: string; path: string; protected?: boolean })[]
  java_auto?: boolean
  java_path?: string
  memory_auto?: boolean
  memory_size?: number
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system'
  primary_color: string
  blur_amount: number
  sidebar_collapsed: boolean
  titlebar_hidden: boolean
}

export interface DownloadConfig {
  mirror_source: 'official' | 'bmclapi'
  download_threads: number
}

export interface MouseEffectConfig {
  enabled: boolean
  color: string
  scale: number
  opacity: number
  speed: number
}

export interface LocaleConfig {
  locale: string
}

// ── Java ──────────────────────────────────────────────────────────

export interface JavaInstallation {
  path: string
  version: string
  major_version: number
  java_type: string
  arch: string
  sources: string[]
}

// ── Minecraft 版本 ────────────────────────────────────────────────

export interface MinecraftVersion {
  id: string
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha'
  releaseTime: string
  time: string
  url: string
}

export interface ScannedVersion {
  id: string
  versionId: string
  displayName: string
  primaryLoader: string
  vanillaName: string
  hasForge: boolean
  hasNeoForge: boolean
  hasFabric: boolean
  hasQuilt: boolean
  isBroken: boolean
  jsonPath: string
  sourceName?: string
}

// ── 游戏实例 ──────────────────────────────────────────────────────

export interface GameInstance {
  id: string
  name: string
  type: string
  isRunning: boolean
  version?: string
}

export interface InstanceCreateRequest {
  name: string
  version: string
  gamePath?: string
  memory?: { min: number; max: number }
  javaArgs?: string
}

// ── 账户 ──────────────────────────────────────────────────────────

export interface MinecraftAccount {
  id: string
  alias: string
  type: 'microsoft' | 'offline'
  email: string
  uuid: string
  isCurrent?: boolean
  skinUrl?: string
}

export interface AccountListData {
  accounts: MinecraftAccount[]
  current: MinecraftAccount | null
}

export interface MicrosoftLoginData {
  status: 'pending' | 'completed' | 'error'
  userCode?: string
  verificationUri?: string
  message: string
  interval?: number
}

export interface MicrosoftPollData {
  status: 'pending' | 'ready' | 'error'
  message: string
  retry_after?: number
}

// ── 用户协议 ──────────────────────────────────────────────────────

export interface UserAgreement {
  accepted: boolean
  uuid: string
}

// ── 杂项 ──────────────────────────────────────────────────────────

export interface SelectResult {
  path: string
}

export interface ImageDataUrl {
  dataUrl: string
}

export interface LauncherInfo {
  version: string
  version_type: string
}
