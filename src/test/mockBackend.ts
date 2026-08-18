import { vi, type Mock } from 'vitest'
import type { ApiResponse } from '@/types/api'

/**
 * 构造一个成功响应，用于 mock 的 command 返回值。
 * 注意：mock @/api/client 的 vi.mock 必须写在测试文件顶层（Vitest 只提升顶层调用），
 * 因此这里只提供无提升问题的响应构造工厂。
 */
export function okResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data, timestamp: Date.now() }
}

/** 构造一个失败响应，用于 mock 的 command 返回值 */
export function failResponse(message: string): ApiResponse<never> {
  return { success: false, message, timestamp: Date.now() }
}

/** @/api/client 的 default 导出结构（mock 形态） */
export interface BackendMock {
  default: {
    command: Mock
    on: Mock
    config: { get: Mock; set: Mock }
    runtime: {
      isShowcase: boolean
      isDesktop: boolean
      readonly isDev: boolean
    }
    waitForEventListeners: Mock
  }
}

/** createMockBackend 返回的 mocks 集合，供测试断言与触发事件 */
export interface BackendMocks {
  command: Mock
  on: Mock
  get: Mock
  set: Mock
  waitForEventListeners: Mock
  handlers: Record<string, (payload: unknown) => void>
}

/**
 * 测试文件内 vi.hoisted 持有的状态容器。
 *
 * 注意：Vitest 的 hoist 变换先于 import 赋值执行，因此 vi.hoisted 回调内
 * 不能引用任何 import 进来的符号（会抛 `Cannot access '__vi_import_N__'
 * before initialization`）。createMockBackend 必须通过 vi.mock 的异步工厂
 * 动态导入，再把结果写入 hoisted 容器，测试体即可安全引用。
 */
export interface BackendMockState {
  backend: BackendMock
  mocks: BackendMocks
}

/**
 * 构造统一的 @/api/client mock。
 *
 * 在测试文件中与 vi.hoisted + 异步工厂搭配使用：
 *
 * ```ts
 * const mock = vi.hoisted<{ state?: BackendMockState }>(() => ({ state: undefined }))
 * vi.mock('@/api/client', async () => {
 *   const { createMockBackend } = await import('@/test/mockBackend')
 *   mock.state = createMockBackend()
 *   return mock.state.backend
 * })
 * // 被测模块静态 import '@/api/client'，工厂在 import 阶段已执行，
 * // 模块作用域解构是安全的：
 * const { backend, mocks } = mock.state!
 * ```
 *
 * 覆盖了常用通道：command、on（自动记录 handler）、config.get/set、runtime、
 * waitForEventListeners。测试内可直接引用 mocks.* 断言调用与触发事件。
 * 需要可变 runtime（如 isDesktop）或额外通道时，可在工厂内对
 * mock.state.backend.default 做覆盖。
 */
export function createMockBackend(): BackendMockState {
  const handlers = {} as Record<string, (payload: unknown) => void>
  const command = vi.fn()
  const on = vi.fn((event: string, handler: (payload: unknown) => void) => {
    handlers[event] = handler
    return () => {
      delete handlers[event]
    }
  })
  const get = vi.fn()
  const set = vi.fn()
  const waitForEventListeners = vi.fn().mockResolvedValue(undefined)
  const backend: BackendMock = {
    default: {
      command,
      on,
      config: { get, set },
      runtime: {
        isShowcase: false,
        isDesktop: true,
        get isDev() {
          return false
        },
      },
      waitForEventListeners,
    },
  }
  return {
    backend,
    mocks: { command, on, get, set, waitForEventListeners, handlers },
  }
}

/** 触发某个通过 mock on 注册的事件处理函数 */
export function emitMockEvent(mocks: BackendMocks, event: string, payload: unknown) {
  const handler = mocks.handlers[event]
  if (handler) handler(payload)
}
