import type { LaunchPhase, CrashAnalysisResult } from '@/types/instances'
/**
 * 领域类型定义。
 * 由 types/api.ts 拆分而来，与后端 ECL/api/models.py 的 Pydantic 模型对齐。
 */

export interface UserAgreement {
  accepted: boolean
  uuid: string
}

// ═══════════════════════════════════════════════════════════════════
//  启动器信息 / 密钥环
// ═══════════════════════════════════════════════════════════════════

export interface LauncherInfo {
  version: string
  version_type: string
  debug: boolean
}

export interface DebugMaintenanceResult {
  action: 'reset_launcher_data' | 'clear_plugins'
  restart_required: boolean
  targets: string[]
}

// ═══════════════════════════════════════════════════════════════════
//  页信息卡
// ═══════════════════════════════════════════════════════════════════

export interface InfoCardData {
  mode: InfoCardMode
  tip_title?: string
  announcement_title?: string
  tips: string[]
  announcements: InfoCardAnnouncement[]
  welcome?: InfoCardWelcome | null
  interval?: number
}

// ═══════════════════════════════════════════════════════════════════
//  文件 / 图片
// ═══════════════════════════════════════════════════════════════════

export interface FsEntry {
  name: string
  is_dir: boolean
  size: number
  mtime: number
}

export interface FileContent {
  content: string
  size: number
}

export interface PathInfo {
  exists: boolean
  is_dir: boolean
  is_file: boolean
}

// ═══════════════════════════════════════════════════════════════════
//  Mod / 资源
// ═══════════════════════════════════════════════════════════════════

export interface LaunchProgress {
  phase: LaunchPhase
  message: string
  percent?: number
  done?: number
  total?: number
  errorCode?: string
}

// ═══════════════════════════════════════════════════════════════════
//  事件映射
// ═══════════════════════════════════════════════════════════════════

export interface LauncherErrorEvent {
  error_id: string
  title: string
  message: string
  detail?: string
  kind?: 'game_crash'
  crash?: CrashAnalysisResult
}

export interface TerminalLogEntry {
  time: string
  level: string
  logger: string
  filename: string
  lineno: number
  message: string
}

// ═══════════════════════════════════════════════════════════════════
//  子进程实例
// ═══════════════════════════════════════════════════════════════════

/** 后端登记的一个子进程实例（由插件经 ProcessService 启动） */
export interface ProcessInstance {
  id: string
  name: string
  type: string
  pid: number | null
  /** 是否开启标准输入管道（可交互） */
  stdin: boolean
  running: boolean
  /** 该实例最近输出行（环形，最多 BUFFER_LIMIT 条，旧在前新在后） */
  lines: string[]
}

/** 实时推送的某实例单行输出 */

export type LauncherPopupLevel = 'info' | 'warning' | 'critical'

export interface LauncherPopupEvent {
  id: string
  title: string
  content: string
  level?: LauncherPopupLevel
  dismissible?: boolean
  cacheable?: boolean
  /** @deprecated 使用 cacheable；保留用于兼容已有后端事件。 */
  once?: boolean
}

export type InfoCardMode = 'auto' | 'rotate' | 'announcement_first' | 'tip_only' | 'announcement_only'

export interface InfoCardAnnouncement {
  id?: string
  title: string
  date: string
  content: string
}

export interface InfoCardWelcome {
  title: string
  content: string
  imageUrl?: string
}
export interface ImageSaveAsPayload {
  data_url?: string
  url?: string
  path?: string
}

export interface ProcessLogEntry {
  instanceId: string
  name: string
  type: string
  line: string
}

