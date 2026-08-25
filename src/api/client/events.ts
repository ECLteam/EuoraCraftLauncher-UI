import type { BackendEventName, BackendEvents } from '@/types/api'
import { Logger, transport } from './state'

interface EventSubscription {
  callback: (payload: unknown) => void
  dispose: () => void
}

const _eventCleanups = new Map<string, Set<EventSubscription>>()
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
    for (const subscription of Array.from(cleanups)) {
      if (subscription.callback === cb) subscription.dispose()
    }
  } else {
    for (const subscription of Array.from(cleanups)) subscription.dispose()
  }
}

function subscribeEvent<T>(event: string, cb: (payload: T) => void): () => void {
  let unlisten: (() => void) | null = null
  let disposed = false
  const trackedCallback = cb as (payload: unknown) => void
  const subscriptions = _eventCleanups.get(event) ?? new Set<EventSubscription>()
  const subscription: EventSubscription = {
    callback: trackedCallback,
    dispose: () => {
      if (disposed) return
      disposed = true
      try {
        unlisten?.()
      } catch {
        /* 清理时忽略错误 */
      }
      unlisten = null
      subscriptions.delete(subscription)
      if (subscriptions.size === 0) _eventCleanups.delete(event)
    },
  }
  subscriptions.add(subscription)
  _eventCleanups.set(event, subscriptions)

  const registration = onEvent<T>(event, cb)
    .then((fn) => {
      if (disposed) {
        fn()
        return
      }
      unlisten = fn
    })
    .catch((err) => {
      Logger.error(`[on] 注册事件 ${event} 失败:`, err)
    })
    .finally(() => {
      _pendingEventRegistrations.delete(registration)
    })
  _pendingEventRegistrations.add(registration)

  return subscription.dispose
}

async function waitForEventListeners(): Promise<void> {
  while (_pendingEventRegistrations.size > 0) {
    await Promise.all(Array.from(_pendingEventRegistrations))
  }
}

export function createEvents() {
  return {
    on<E extends BackendEventName>(event: E, cb: (payload: BackendEvents[E]) => void): () => void {
      return subscribeEvent(event, cb)
    },
    onAny<T = unknown>(event: string, cb: (payload: T) => void): () => void {
      return subscribeEvent(event, cb)
    },
    off<E extends BackendEventName>(event: E, cb?: (payload: BackendEvents[E]) => void) {
      offEvent(event, cb as ((payload: unknown) => void) | undefined)
    },
    waitForEventListeners,
  }
}

export { waitForEventListeners }
