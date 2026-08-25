import { QueryClient } from '@tanstack/vue-query'

/**
 * IPC 请求不应因浏览器焦点或网络状态变化而自动重试。
 * 业务层在发生写操作后显式失效对应查询，确保数据更新可预测。
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 30 * 60_000,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  })
}

export const queryClient = createQueryClient()
