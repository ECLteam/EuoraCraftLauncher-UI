import { ref } from 'vue'
import { useGlassMessage } from './useGlassMessage'

export interface UseAsyncActionOptions {
  successMessage?: string
  errorMessage?: string
  showSuccess?: boolean
  showError?: boolean
}

/**
 * 统一封装异步动作，自动管理 loading 状态并处理错误/成功提示。
 * @param options - 默认提示选项
 * @returns loading 状态和执行函数 run
 */
export function useAsyncAction(options: UseAsyncActionOptions = {}) {
  const message = useGlassMessage()
  const loading = ref(false)

  /**
   * 执行异步函数。
   * @param fn - 待执行的异步函数
   * @param runOptions - 单次执行的提示选项，可覆盖默认选项
   * @returns 函数返回值，失败时返回 null
   */
  async function run<T>(
    fn: () => Promise<T | null | undefined>,
    runOptions: Partial<UseAsyncActionOptions> = {}
  ): Promise<T | null> {
    const opts = { ...options, ...runOptions }
    loading.value = true
    try {
      const result = await fn()
      if (opts.showSuccess && opts.successMessage) {
        message.success(opts.successMessage)
      }
      return result ?? null
    } catch (e) {
      const msg = opts.errorMessage || (e instanceof Error ? e.message : String(e))
      if (opts.showError !== false) {
        message.error(msg)
      }
      return null
    } finally {
      loading.value = false
    }
  }

  return { loading, run }
}
