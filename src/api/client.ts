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

import { launcherErrorQueue } from '@/app/runtime/errorPresentation'
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
import { getErrorMessage } from '@/utils/error'
import { createBackendTransport } from './transport'
import { createShowcaseTransport } from './transport/showcase'

const CONFIG = {
  DEBUG: import.meta.env.DEV,
} as const

/** 高频轮询命令：不打印 [API] 成功日志，避免开发控制台刷屏 */
const SILENT_COMMANDS = new Set(['launcher_errors_pending'])

class Logger {
  static log(...args: unknown[]) {
    if (CONFIG.DEBUG) {
      // eslint-disable-next-line no-console
      console.log('[API]', ...args)
    }
  }
  static error(...args: unknown[]) {
    console.error('[API Error]', ...args)
  }
}

let transport = createBackendTransport()

function checkEnv(): boolean {
  return transport.available
}

// ── IPC 调用 ──────────────────────────────────────────────────────

/**
 * 统一调用后端方法并包装为 ApiResponse。
 * @param command - 独立的后端命令名
 * @param payload - 命令参数对象
 * @returns 包含 success/data/message 的标准响应
 */
async function call<T = unknown>(command: string, payload: unknown = {}): Promise<ApiResponse<T>> {
  const start = performance.now()
  try {
    if (!checkEnv()) throw new Error('PyTauri 环境未就绪')
    const raw = await transport.invoke(command, payload)
    const dur = (performance.now() - start).toFixed(1)
    if (!raw || typeof raw !== 'object') {
      return { success: false, message: '后端返回了非对象响应', timestamp: Date.now() }
    }
    const response = raw as ApiResponse<T>
    if (!response.success && !response.message?.trim()) {
      const code = response.errorCode ? ` (${response.errorCode})` : ''
      response.message = `${command} 执行失败${code}`
    }
    if (!response.success && response.presentation === 'modal' && response.errorId) {
      launcherErrorQueue.enqueue({
        error_id: response.errorId,
        title: response.title || '启动器发生错误',
        message: response.message || `${command} 执行失败`,
        detail: response.detail,
      })
    }
    // 高频轮询命令跳过成功日志，仅在失败时打印
    if (!SILENT_COMMANDS.has(command) || !response.success) {
      Logger.log(`${response.success ? 'OK' : 'ERR'} ${command} (${dur}ms)`)
    }
    return response
  } catch (e) {
    Logger.error(`${command}:`, e)
    return { success: false, message: getErrorMessage(e), timestamp: Date.now() }
  }
}

// ── 事件侦听 ──────────────────────────────────────────────────────

const _eventCleanups = new Map<string, Map<(payload: unknown) => void, () => void>>()
const _pendingEventRegistrations = new Set<Promise<void>>()

/**
 * 注册单次事件监听器。
 * @param event - 事件名称
 * @param handler - 事件处理函数
 * @returns 取消监听的函数
 */
async function onEvent<T = unknown>(event: string, handler: (payload: T) => void): Promise<() => void> {
  if (!transport.available) throw new Error('后端 Transport 未就绪')
  return transport.listen(event, handler)
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
      try {
        unlisten()
      } catch {
        /* 清理时忽略错误 */
      }
      cleanups.delete(cb)
      if (cleanups.size === 0) _eventCleanups.delete(event)
    }
  } else {
    for (const fn of cleanups.values()) {
      try {
        fn()
      } catch {
        /* 清理时忽略错误 */
      }
    }
    cleanups.clear()
    _eventCleanups.delete(event)
  }
}

function subscribeEvent<T>(event: string, cb: (payload: T) => void): () => void {
  let unlisten: (() => void) | null = null
  let unlistened = false
  const trackedCallback = cb as (payload: unknown) => void

  const registration = onEvent<T>(event, cb)
    .then((fn) => {
      if (unlistened) {
        fn()
        return
      }

      let disposed = false
      unlisten = () => {
        if (disposed) return
        disposed = true
        fn()
        const cleanups = _eventCleanups.get(event)
        cleanups?.delete(trackedCallback)
        if (cleanups?.size === 0) _eventCleanups.delete(event)
      }
      const cleanups = _eventCleanups.get(event) ?? new Map()
      cleanups.set(trackedCallback, unlisten)
      _eventCleanups.set(event, cleanups)
    })
    .catch((err) => {
      Logger.error(`[on] 注册事件 ${event} 失败:`, err)
    })
    .finally(() => {
      _pendingEventRegistrations.delete(registration)
    })
  _pendingEventRegistrations.add(registration)

  return () => {
    unlistened = true
    if (unlisten) {
      unlisten()
      unlisten = null
    }
  }
}

async function waitForEventListeners(): Promise<void> {
  while (_pendingEventRegistrations.size > 0) {
    await Promise.all(Array.from(_pendingEventRegistrations))
  }
}

// ── 本地图片路径转安全 Data URL ────────────────────────────────────

/**
 * 通过后端读取本地图片并转换为可在 DOM 中直接使用的 Data URL。
 *
 * 不依赖 Tauri Asset Protocol，避免未启用本地资源服务时生成无法连接的
 * `asset.localhost` 地址，也避免扩大 WebView 可直接读取的文件路径范围。
 *
 * @param path - 本地图片路径
 * @returns 图片 Data URL，读取失败时返回 null
 */
async function resolveFileUrl(path: string): Promise<string | null> {
  const res = await call<{ dataUrl: string }>('image_read_file', { path })
  return res.success && res.data?.dataUrl ? res.data.dataUrl : null
}

// ═══════════════════════════════════════════════════════════════════
//  导出
// ═══════════════════════════════════════════════════════════════════

let showcaseActive = false

function swapToShowcase(): void {
  const showcase = createShowcaseTransport()
  // 保持 desktop 模式，确保窗口控制按钮正常显示
  transport = { ...showcase, mode: 'desktop' }
  showcaseActive = true
}

export const backend = {
  /** 当前应用运行环境。业务代码不应再直接检测 window.__TAURI__。 */
  runtime: {
    get mode() {
      return transport.mode
    },
    get isAvailable() {
      return transport.available
    },
    get isDesktop() {
      return transport.mode === 'desktop'
    },
    get isShowcase() {
      return showcaseActive || transport.mode === 'showcase'
    },
  },

  /** 配置存取 — 前端定义结构，后端只持久化 */
  config: {
    get<T = unknown>(section: ConfigSection) {
      return call<T>('settings_get', { section })
    },
    set(section: ConfigSection, data: unknown) {
      return call<void>('settings_set', { section, data })
    },
    async list(): Promise<ApiResponse<string[]>> {
      const response = await call<Record<string, unknown>>('settings_get')
      if (!response.success) return response as unknown as ApiResponse<string[]>
      return { ...response, data: Object.keys(response.data ?? {}) }
    },

    /** 一次拉取全部配置 */
    getAll() {
      return call<Record<string, unknown>>('settings_get')
    },

    /** 一次拉取多个分区 */
    getMany(sections: ConfigSection[]) {
      return call<Record<string, unknown>>('settings_get', { sections })
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
    params?: CommandPayloadMap[K]
  ): Promise<ApiResponse<CommandResponseMap[K]>> {
    return call(String(name), params ?? {})
  },

  /**
   * 监听后端事件。
   * @param event - 事件名称
   * @param cb - 事件回调函数
   * @returns 取消监听的函数
   */
  on<E extends BackendEventName>(event: E, cb: (payload: BackendEvents[E]) => void): () => void {
    return subscribeEvent(event, cb)
  },

  onAny<T = unknown>(event: string, cb: (payload: T) => void): () => void {
    return subscribeEvent(event, cb)
  },

  off<E extends BackendEventName>(event: E, cb?: (payload: BackendEvents[E]) => void) {
    offEvent(event, cb as ((payload: unknown) => void) | undefined)
  },

  /** 等待所有异步 Tauri 事件监听器完成注册。 */
  waitForEventListeners,

  /** 文件系统 */
  fs: {
    readDir(path: string) {
      return call<FsEntry[]>('fs_read_dir', { path })
    },
    readFile(path: string, mode: 'text' | 'base64' = 'text') {
      return call<FileContent>('fs_read_file', { path, mode })
    },
    exists(path: string) {
      return call<PathInfo>('fs_exists', { path })
    },
  },

  /** 文件路径工具 */
  file: {
    /** 将本地图片路径转为可在 <img> 中直接使用的 Data URL */
    async toUrl(path: string): Promise<string | null> {
      return resolveFileUrl(path)
    },

    /** 路径规整与存在性校验 */
    resolve(path: string) {
      return call<{ path: string }>('file_resolve', { path })
    },
  },

  /** 切换到展示模式 mock 数据（由 ECL_CONFIG_launcher_showcase 环境变量触发） */
  swapToShowcase,
  get isShowcaseActive() {
    return showcaseActive
  },
}

export default backend
