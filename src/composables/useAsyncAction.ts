// 统一封装异步动作：loading、错误提示、成功提示

import { ref } from 'vue'
import { useGlassMessage } from './useGlassMessage'

export interface UseAsyncActionOptions {
  successMessage?: string
  errorMessage?: string
  showSuccess?: boolean
  showError?: boolean
}

export function useAsyncAction(options: UseAsyncActionOptions = {}) {
  const message = useGlassMessage()
  const loading = ref(false)

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
