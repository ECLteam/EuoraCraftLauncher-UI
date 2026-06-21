/**
 * 通用 API 客户端。
 *
 * 三组操作 + 事件系统 + 文件系统：
 *
 *   backend.config.get/set/getAll/getMany
 *   backend.command(name, params)
 *   backend.on/off(event, cb)
 *   backend.fs.readDir/readFile/exists
 *   backend.file.resolve
 *
 * 前端定义所有数据类型。社区替换前端时只需保持接口不变。
 */

import type { ApiResponse } from '@/types/api'

const CONFIG = {
  DEBUG: import.meta.env.DEV,
} as const

class Logger {
  static log(...args: any[]) { CONFIG.DEBUG && console.log('[API]', ...args) }
  static error(...args: any[]) { console.error('[API Error]', ...args) }
}

// ── 环境检测 ──────────────────────────────────────────────────────

function getTauri(): any {
  return (window as any).__TAURI__
}

function checkEnv(): boolean {
  return !!getTauri()?.pytauri
}

function getCore(): any {
  return getTauri()?.core
}

// ── IPC 调用 ──────────────────────────────────────────────────────

async function invoke(method: string, ...payloads: any[]): Promise<any> {
  const tauri = getTauri()
  return tauri.pytauri.pyInvoke('api_call', { method, args: payloads })
}

async function call<T = any>(method: string, ...args: any[]): Promise<ApiResponse<T>> {
  const start = performance.now()
  try {
    if (!checkEnv()) throw new Error('PyTauri 环境未就绪')
    const raw = await invoke(method, ...args)
    const dur = (performance.now() - start).toFixed(1)
    if (!raw || typeof raw !== 'object') {
      return { success: true, data: raw as T, message: '自动标准化', timestamp: Date.now() }
    }
    Logger.log(`${raw.success ? '✓' : '✗'} ${method} (${dur}ms)`)
    return raw as ApiResponse<T>
  } catch (e) {
    Logger.error(`${method}:`, e)
    return { success: false, message: (e as Error)?.message || '未知错误', timestamp: Date.now() }
  }
}

// ── 事件侦听 ──────────────────────────────────────────────────────

const _eventCleanups = new Map<string, Set<() => void>>()

function onEvent(event: string, cb: (payload: any) => void) {
  const core = getCore()
  if (!core?.listen) {
    console.warn('[API] Tauri event.listen 不可用')
    return () => {}
  }
  const unlisten = core.listen(event, (e: any) => cb(e.payload))
  if (!_eventCleanups.has(event)) {
    _eventCleanups.set(event, new Set())
  }
  _eventCleanups.get(event)!.add(unlisten)
  return unlisten
}

function offEvent(event: string) {
  const cleanups = _eventCleanups.get(event)
  if (!cleanups) return
  for (const fn of cleanups) {
    try { fn() } catch {}
  }
  cleanups.clear()
}

// ── 文件路径转可访问 URL ──────────────────────────────────────────

async function resolveFileUrl(path: string): Promise<string | null> {
  // 先校验路径
  const res = await call<{ path: string }>('exec_action', { name: 'file_resolve', params: { path } })
  if (!res.success || !res.data?.path) return null

  // 尝试 Tauri asset protocol
  const core = getCore()
  if (core?.convertFileSrc) {
    try {
      return core.convertFileSrc(res.data.path)
    } catch {}
  }
  return null
}

// ══════════════════════════════════════════════════════════════════
//  CommandMap — 类型安全的命令名称与参数映射
//  社区前端替换时只需更新此映射即可获得完整类型提示。
// ══════════════════════════════════════════════════════════════════

interface CommandMap {
  ping: undefined

  // Java
  java_scan: undefined
  java_list: undefined

  // 游戏版本
  minecraft_versions: { filter_type?: string }
  scan_versions: { paths?: any }
  uninstall_version: { version_id: string; game_path?: string }

  // 账户
  accounts_list: undefined
  accounts_current: undefined
  accounts_add_offline: { username: string }
  accounts_start_microsoft_login: undefined
  accounts_poll_microsoft_login: undefined
  accounts_complete_microsoft_login: undefined
  accounts_switch: { account_id: string }
  accounts_remove: { account_id: string }
  accounts_refresh_profile: { account_id: string }

  // 用户协议
  user_agreement_get: undefined
  user_agreement_save: undefined
  user_agreement_clear: undefined

  // 图片
  image_fetch_data_url: { url: string }
  image_save_url: { url: string }
  image_read_file: { path: string }
  avatar_data_url: { uuid: string; type_name?: string; size?: number; use_default_skin?: boolean; avatar_type?: string }

  // 文件选择
  select_directory: undefined
  select_java: undefined
  select_image: undefined

  // 游戏实例
  instances_list: undefined
  instance_stop: { instance_id: string }

  // 启动器信息
  launcher_info: undefined
  list_sections: undefined

  // 批量配置
  config_get_all: undefined
  config_get_many: { sections: string[] }

  // 文件系统
  fs_read_dir: { path: string }
  fs_read_file: { path: string; mode?: 'text' | 'base64' }
  fs_exists: { path: string }

  // 文件路径
  file_resolve: { path: string }
}

// ══════════════════════════════════════════════════════════════════
//  导出
// ══════════════════════════════════════════════════════════════════

export const backend = {

  /** 配置存取 — 前端定义结构，后端只持久化 */
  config: {
    get<T = any>(section: string) { return call<{ [k: string]: any } & T>('config_get', section) },
    set(section: string, data: any) { return call('config_set', section, data) },
    list() { return call<string[]>('config_list') },

    /** 一次拉取全部配置 */
    getAll() { return call<Record<string, any>>('config_get_all') },

    /** 一次拉取多个分区 */
    getMany(sections: string[]) { return call<Record<string, any>>('config_get_many', sections) },
  },

  /** 后端动作 — 类型安全 */
  command<T = any>(name: keyof CommandMap, params?: CommandMap[keyof CommandMap]) {
    return call<T>('exec_action', { name, params })
  },

  /** 事件 — 后端主动推送 */
  on(event: string, cb: (payload: any) => void) {
    return onEvent(event, cb)
  },

  off(event: string) {
    offEvent(event)
  },

  /** 文件系统 */
  fs: {
    readDir(path: string) {
      return call<{ name: string; is_dir: boolean; size: number; mtime: number }[]>('exec_action', {
        name: 'fs_read_dir', params: { path },
      })
    },
    readFile(path: string, mode: 'text' | 'base64' = 'text') {
      return call<{ content: string; size: number }>('exec_action', {
        name: 'fs_read_file', params: { path, mode },
      })
    },
    exists(path: string) {
      return call<{ exists: boolean; is_dir: boolean; is_file: boolean }>('exec_action', {
        name: 'fs_exists', params: { path },
      })
    },
  },

  /** 文件路径工具 */
  file: {
    /** 将本地文件路径转为可在 <img>/<video> 中直接使用的 URL */
    async toUrl(path: string): Promise<string | null> {
      return resolveFileUrl(path)
    },

    /** 路径规整与存在性校验 */
    resolve(path: string) {
      return call<{ path: string; is_dir: boolean; is_file: boolean; mime: string }>('exec_action', {
        name: 'file_resolve', params: { path },
      })
    },
  },
}

export default backend
