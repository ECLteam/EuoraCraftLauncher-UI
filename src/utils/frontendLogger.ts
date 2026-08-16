import backend from '@/api/client'

/**
 * 前端日志转发模块。
 *
 * 拦截 console 的错误与警告输出并通过 IPC 上报到后端统一归档，用于排查前端异常。
 * 普通信息日志不转发，避免高频 IPC 占用。仅桌面（Tauri）环境启用；
 * 展示模式与纯浏览器调试环境不会产生任何 IPC 开销。
 */

export type FrontendLogLevel = 'warn' | 'error'

const MAX_MESSAGE_LENGTH = 20000
const MAX_DETAIL_LENGTH = 100000

// WebGL 驱动的非致命着色器编译警告（如 Sample Bias 越界），无排查价值，抑制其输出与归档避免刷屏
const NOISE_PATTERNS: RegExp[] = [/THREE\.WebGLProgram/]

let installed = false
let sending = false

function isNoise(args: unknown[]): boolean {
  return args.some((arg) => typeof arg === 'string' && NOISE_PATTERNS.some((pattern) => pattern.test(arg)))
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (value instanceof Error) return value.stack || value.message
  if (typeof value === 'undefined') return 'undefined'
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`
  if (typeof value === 'symbol') return value.toString()
  try {
    const serialized = JSON.stringify(value, (_key, item) => {
      if (typeof item === 'bigint') return `${item}n`
      if (item instanceof Error) return item.stack || item.message
      return item
    })
    return serialized ?? String(value)
  } catch {
    return String(value)
  }
}

function serializeArgs(args: unknown[]): { message: string; detail?: string } {
  if (args.length === 0) return { message: '' }
  const [first, ...rest] = args
  const message = formatValue(first)
  if (rest.length === 0) return { message }
  return { message, detail: rest.map(formatValue).join(' ') }
}

function forward(level: FrontendLogLevel, args: unknown[]): void {
  if (!backend.runtime.isDesktop || sending) return
  const { message, detail } = serializeArgs(args)
  if (!message && !detail) return
  sending = true
  backend
    .command('frontend_log', {
      level,
      message: message.slice(0, MAX_MESSAGE_LENGTH),
      detail: detail ? detail.slice(0, MAX_DETAIL_LENGTH) : undefined,
    })
    .catch(() => undefined)
    .finally(() => {
      sending = false
    })
}

/**
 * 安装 console 拦截器。幂等，应用启动早期调用一次即可。
 */
export function installFrontendLogging(): void {
  if (installed) return
  installed = true

  const methods: Array<[keyof Pick<Console, 'warn' | 'error'>, FrontendLogLevel]> = [
    ['error', 'error'],
    ['warn', 'warn'],
  ]

  for (const [method, level] of methods) {
    // eslint-disable-next-line no-console -- 拦截并代理 console 是日志转发模块的核心职责
    const original = console[method]
    if (typeof original !== 'function') continue
    // eslint-disable-next-line no-console -- 同上，替换 console 方法以转发日志
    console[method] = (...args: unknown[]) => {
      if (isNoise(args)) return
      try {
        original.apply(console, args)
      } catch {
        // 原始控制台输出失败时不阻断日志转发
      }
      forward(level, args)
    }
  }
}
