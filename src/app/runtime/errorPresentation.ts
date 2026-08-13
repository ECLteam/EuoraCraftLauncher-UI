import { computed, ref } from 'vue'
import type { ApiResponse, LauncherErrorEvent } from '@/types/api'

const MAX_SEEN_ERRORS = 100
const MESSAGE_SUPPRESSION_MS = 5000

export class BackendCommandError extends Error {
  readonly errorCode?: string
  readonly presentation: 'message' | 'modal'
  readonly errorId?: string
  readonly title?: string
  readonly detail?: string

  constructor(response: ApiResponse<unknown>, fallback: string) {
    super(response.message?.trim() || fallback)
    this.name = 'BackendCommandError'
    this.errorCode = response.errorCode
    this.presentation = response.presentation ?? 'message'
    this.errorId = response.errorId
    this.title = response.title
    this.detail = response.detail
  }
}

function normalizeError(payload: LauncherErrorEvent): LauncherErrorEvent | null {
  const errorId = payload.error_id?.trim()
  const message = payload.message?.trim()
  if (!errorId || !message) return null
  return {
    error_id: errorId,
    title: payload.title?.trim() || '启动器发生错误',
    message,
    detail: payload.detail?.trim() || undefined,
    kind: payload.kind,
    crash: payload.kind === 'game_crash' ? payload.crash : undefined,
  }
}

export function createLauncherErrorQueue() {
  const queue = ref<LauncherErrorEvent[]>([])
  const seenIds = new Set<string>()
  const seenOrder: string[] = []
  const suppressedMessages = new Map<string, number>()

  const activeError = computed(() => queue.value[0] ?? null)
  const visible = computed(() => activeError.value !== null)

  function remember(errorId: string): void {
    seenIds.add(errorId)
    seenOrder.push(errorId)
    while (seenOrder.length > MAX_SEEN_ERRORS) {
      const oldest = seenOrder.shift()
      if (oldest) seenIds.delete(oldest)
    }
  }

  function enqueue(payload: LauncherErrorEvent): boolean {
    const error = normalizeError(payload)
    if (!error || seenIds.has(error.error_id)) return false
    remember(error.error_id)
    suppressedMessages.set(error.message, Date.now() + MESSAGE_SUPPRESSION_MS)
    queue.value.push(error)
    return true
  }

  function dismissActive(): void {
    queue.value.shift()
  }

  function consumeSuppressedMessage(message: string): boolean {
    const expiresAt = suppressedMessages.get(message)
    if (!expiresAt) return false
    suppressedMessages.delete(message)
    return expiresAt >= Date.now()
  }

  return { activeError, visible, enqueue, dismissActive, consumeSuppressedMessage }
}

export const launcherErrorQueue = createLauncherErrorQueue()

export function unwrapResponse<T>(response: ApiResponse<T>, operation: string): T {
  if (response.success) return response.data as T
  const error = new BackendCommandError(response, `${operation}失败`)
  if (error.presentation === 'modal' && error.errorId) {
    launcherErrorQueue.enqueue({
      error_id: error.errorId,
      title: error.title || '启动器发生错误',
      message: error.message,
      detail: error.detail,
    })
  }
  throw error
}
