import { vi } from 'vitest'
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

/**
 * 构造统一的 @/api/client mock。
 *
 * 在测试文件中与 vi.hoisted 搭配使用：
 *
 * ```ts
 * const { backend, mocks } = vi.hoisted(() => createMockBackend())
 * vi.mock('@/api/client', () => backend)
 * ```
 *
 * 覆盖了常用通道：command、on（自动记录 handler）、config.get/set、runtime、
 * waitForEventListeners。测试内可直接引用 mocks.* 断言调用与触发事件。
 */
export function createMockBackend() {
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
  const backend = {
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
export function emitMockEvent(mocks: ReturnType<typeof createMockBackend>['mocks'], event: string, payload: unknown) {
  const handler = mocks.handlers[event]
  if (handler) handler(payload)
}
