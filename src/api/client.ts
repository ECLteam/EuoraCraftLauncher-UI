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

import type {
  ApiResponse,
  BackendEvents,
  BackendEventName,
  CommandPayloadMap,
  CommandResponseMap,
  ConfigSection,
  FileContent,
  FsEntry,
  PathInfo,
} from '@/types/api'

const CONFIG = {
  DEBUG: import.meta.env.DEV,
} as const

class Logger {
  static log(...args: unknown[]) {
    if (CONFIG.DEBUG) {
      // eslint-disable-next-line no-console
      console.log('[API]', ...args)
    }
  }
  static error(...args: unknown[]) { console.error('[API Error]', ...args) }
}

// ── 环境检测 ──────────────────────────────────────────────────────

interface TauriGlobal {
  pytauri: {
    pyInvoke: (cmd: string, payload?: unknown) => Promise<unknown>
  }
  event: {
    listen: <T = unknown>(event: string, handler: (e: { payload: T }) => void) => Promise<() => void>
  }
  core: {
    convertFileSrc?: (path: string) => string
  }
}

function getTauri(): TauriGlobal | undefined {
  return (window as unknown as { __TAURI__?: TauriGlobal }).__TAURI__
}

function checkEnv(): boolean {
  return !!getTauri()?.pytauri
}

function getCore(): TauriGlobal['core'] | undefined {
  return getTauri()?.core
}

// ── IPC 调用 ──────────────────────────────────────────────────────

const IPC_TIMEOUT_MS = 30000

/**
 * 带超时的 IPC 调用。
 * @param method - 后端方法名
 * @param payloads - 传递给后端的参数列表
 * @returns 后端返回的原始数据
 * @throws 当 Tauri 环境未就绪或调用超时时抛出错误
 */
async function invokeWithTimeout(method: string, ...payloads: unknown[]): Promise<unknown> {
  const tauri = getTauri()
  if (!tauri) throw new Error('Tauri 环境未就绪')
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`IPC 调用超时 (${IPC_TIMEOUT_MS / 1000}s): ${method}`)), IPC_TIMEOUT_MS)
  )
  return Promise.race([tauri.pytauri.pyInvoke('api_call', { method, args: payloads }), timeoutPromise])
}

/**
 * 统一调用后端方法并包装为 ApiResponse。
 * @param method - 后端方法名
 * @param args - 方法参数列表
 * @returns 包含 success/data/message 的标准响应
 */
async function call<T = unknown>(method: string, ...args: unknown[]): Promise<ApiResponse<T>> {
  const start = performance.now()
  try {
    if (!checkEnv()) throw new Error('PyTauri 环境未就绪')
    const raw = await invokeWithTimeout(method, ...args)
    const dur = (performance.now() - start).toFixed(1)
    if (!raw || typeof raw !== 'object') {
      return { success: false, message: '后端返回了非对象响应', timestamp: Date.now() }
    }
    Logger.log(`${(raw as ApiResponse).success ? 'OK' : 'ERR'} ${method} (${dur}ms)`)
    return raw as ApiResponse<T>
  } catch (e) {
    Logger.error(`${method}:`, e)
    return { success: false, message: (e as Error)?.message || '未知错误', timestamp: Date.now() }
  }
}

// ── 事件侦听 ──────────────────────────────────────────────────────

const _eventCleanups = new Map<string, Map<(payload: unknown) => void, () => void>>()

/**
 * 注册单次事件监听器。
 * @param event - 事件名称
 * @param handler - 事件处理函数
 * @returns 取消监听的函数
 */
async function onEvent<T = unknown>(
  event: string,
  handler: (payload: T) => void,
): Promise<() => void> {
  const tauri = getTauri()
  if (!tauri) throw new Error('Tauri 环境未就绪')
  const unlisten = await tauri.event.listen<T>(event, (e) => handler(e.payload))
  return () => { unlisten() }
}

/**
 * 移除事件监听器。
 * @param event - 事件名称
 * @param cb - 要移除的回调函数，不传则移除该事件所有监听
 */
function offEvent(event: string, cb?: (payload: unknown) => void) {
  const cleanups = _eventCleanups.get(event)
  if (!cleanups) return
  if (cb) {
    const unlisten = cleanups.get(cb)
    if (unlisten) {
      try { unlisten() } catch { /* 清理时忽略错误 */ }
      cleanups.delete(cb)
    }
  } else {
    for (const fn of cleanups.values()) {
      try { fn() } catch { /* 清理时忽略错误 */ }
    }
    cleanups.clear()
  }
}

// ── 文件路径转可访问 URL ──────────────────────────────────────────

/**
 * 将本地文件路径转换为可在 DOM 中使用的 URL。
 * @param path - 本地文件路径
 * @returns 可访问的 URL，转换失败时返回 null
 */
async function resolveFileUrl(path: string): Promise<string | null> {
  const res = await call<{ path: string }>('exec_action', { name: 'file_resolve', params: { path } })
  if (!res.success || !res.data?.path) return null

  const core = getCore()
  if (core?.convertFileSrc) {
    try {
      return core.convertFileSrc(res.data.path)
    } catch { /* 转换失败时返回 null */ }
  }
  return null
}

// ═══════════════════════════════════════════════════════════════════
//  导出
// ═══════════════════════════════════════════════════════════════════

export const backend = {

  /** 配置存取 — 前端定义结构，后端只持久化 */
  config: {
    get<T = unknown>(section: ConfigSection) {
      return call<T>('config_get', section)
    },
    set(section: ConfigSection, data: unknown) {
      return call('config_set', section, data)
    },
    list() {
      return call<string[]>('config_list')
    },

    /** 一次拉取全部配置 */
    getAll() {
      return call<Record<string, unknown>>('config_get_all')
    },

    /** 一次拉取多个分区 */
    getMany(sections: ConfigSection[]) {
      return call<Record<string, unknown>>('config_get_many', sections)
    },
  },

  /**
   * 调用后端动作命令。
   * @param name - 命令名称
   * @param params - 命令参数
   * @returns 命令执行结果
   */
  command<K extends keyof CommandPayloadMap>(
    name: K,
    params?: CommandPayloadMap[K],
  ): Promise<ApiResponse<CommandResponseMap[K]>> {
    return call('exec_action', { name, params })
  },

  /**
   * 监听后端事件。
   * @param event - 事件名称
   * @param cb - 事件回调函数
   * @returns 取消监听的函数
   */
  on<E extends BackendEventName>(
    event: E,
    cb: (payload: BackendEvents[E]) => void,
  ): () => void {
    let unlisten: (() => void) | null = null
    let unlistened = false

    onEvent<BackendEvents[E]>(event, cb).then(fn => {
      if (unlistened) {
        fn()
      } else {
        unlisten = fn
      }
    }).catch(err => {
      Logger.error(`[on] 注册事件 ${event} 失败:`, err)
    })

    return () => {
      unlistened = true
      if (unlisten) {
        unlisten()
        unlisten = null
      }
    }
  },

  off(event: string, cb?: (payload: unknown) => void) {
    offEvent(event, cb)
  },

  /** 文件系统 */
  fs: {
    readDir(path: string) {
      return call<FsEntry[]>('exec_action', {
        name: 'fs_read_dir', params: { path },
      })
    },
    readFile(path: string, mode: 'text' | 'base64' = 'text') {
      return call<FileContent>('exec_action', {
        name: 'fs_read_file', params: { path, mode },
      })
    },
    exists(path: string) {
      return call<PathInfo>('exec_action', {
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
      return call<{ path: string }>('exec_action', {
        name: 'file_resolve', params: { path },
      })
    },
  },

}

export default backend
