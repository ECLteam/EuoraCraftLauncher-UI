import { computed, ref } from 'vue'

export type AsyncStatus = 'idle' | 'loading' | 'ready' | 'error'

/**
 * 创建一组「状态 + 是否加载中」的响应式对。
 *
 * 多个异步数据源需共用此模式时，调用多次拿到不同的状态对即可。
 * 避免在 store 中重复声明 status ref 与 isLoading computed。
 *
 * @param initial - 初始状态，默认 'idle'
 * @returns `{ status, isLoading }`
 *
 * @example
 * ```ts
 * const { status, isLoading } = useAsyncState()
 * const { status: listStatus, isLoading: isListLoading } = useAsyncState('loading')
 * ```
 */
export function useAsyncState(initial: AsyncStatus = 'idle') {
  const status = ref<AsyncStatus>(initial)
  const isLoading = computed(() => status.value === 'loading')
  return { status, isLoading }
}
