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
