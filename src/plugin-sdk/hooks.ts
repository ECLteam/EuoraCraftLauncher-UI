/**
 * plugin-sdk 生命周期钩子
 * 按插件名隔离，支持定时器、DOM 监听、可见性检测等。
 */

import { ref, type Ref } from 'vue'
import backend from '@/api/client'
import type { CleanupFn } from './types'
import type {
  BackendEventName,
  BackendEvents,
  CommandName,
  CommandPayloadMap,
} from '@/types/api'

const cleanupRegistry = new Map<string, CleanupFn[]>()

export function registerPluginCleanup(plugin: string, fn: CleanupFn): void {
  const list = cleanupRegistry.get(plugin)
  if (list) {
    list.push(fn)
  } else {
    cleanupRegistry.set(plugin, [fn])
  }
}

export const registerCleanup = registerPluginCleanup

export function runPluginCleanup(plugin: string): void {
  const list = cleanupRegistry.get(plugin)
  if (!list) return
  for (const fn of [...list].reverse()) {
    try { fn() } catch { /* 清理时忽略错误 */ }
  }
  cleanupRegistry.delete(plugin)
}

export const runCleanup = runPluginCleanup

export interface PluginHooks {
  useCommand: <K extends CommandName>(
    name: K,
    params?: CommandPayloadMap[K],
  ) => ReturnType<typeof backend.command<K>>
  useEvent: <E extends BackendEventName>(
    event: E,
    handler: (payload: BackendEvents[E]) => void,
  ) => () => void
  useCleanup: (fn: CleanupFn) => void
  useSlot: (slot: string, renderer?: (container: HTMLElement) => void) => HTMLElement | null
  useInterval: (fn: () => void, ms: number) => () => void
  useTimeout: (fn: () => void, ms: number) => () => void
  useResizeObserver: (target: Element | string, callback: (entries: ResizeObserverEntry[]) => void) => () => void
  useIntersectionObserver: (target: Element | string, callback: (entries: IntersectionObserverEntry[]) => void, options?: IntersectionObserverInit) => () => void
  useAnimationFrame: (fn: (time: number) => void) => () => void
  useIdleCallback: (fn: () => void, timeout?: number) => () => void
  useBeforeUnload: (fn: () => void) => () => void
  useVisibilityChange: (options?: { onVisible?: () => void; onHidden?: () => void }) => { visibility: Ref<string> }
  useOnlineStatus: () => { isOnline: Ref<boolean> }
}

export function createHooks(plugin: string): PluginHooks {
  function useCommand<K extends CommandName>(
    name: K,
    params?: CommandPayloadMap[K],
  ): ReturnType<typeof backend.command<K>> {
    return backend.command(name, params)
  }

  function useEvent<E extends BackendEventName>(
    event: E,
    handler: (payload: BackendEvents[E]) => void,
  ): () => void {
    const unlisten = backend.on(event, handler)
    registerPluginCleanup(plugin, unlisten)
    return unlisten
  }

  function useCleanup(fn: CleanupFn): void {
    registerPluginCleanup(plugin, fn)
  }

  function useSlot(slot: string, renderer?: (container: HTMLElement) => void): HTMLElement | null {
    const el = document.getElementById(`plugin-slot-${slot}`)
    if (!el) return null
    if (renderer) {
      renderer(el)
      registerPluginCleanup(plugin, () => {
        el.querySelectorAll(`[data-plugin="${plugin}"]`).forEach(child => child.remove())
      })
    }
    return el
  }

  function useInterval(fn: () => void, ms: number): () => void {
    const id = setInterval(fn, ms)
    const cleanup = () => clearInterval(id)
    registerPluginCleanup(plugin, cleanup)
    return cleanup
  }

  function useTimeout(fn: () => void, ms: number): () => void {
    let cleared = false
    const id = setTimeout(() => {
      if (!cleared) fn()
    }, ms)
    const cleanup = () => { cleared = true; clearTimeout(id) }
    registerPluginCleanup(plugin, cleanup)
    return cleanup
  }

  function useResizeObserver(
    target: Element | string,
    callback: (entries: ResizeObserverEntry[]) => void
  ): () => void {
    const el = typeof target === 'string' ? document.querySelector(target) : target
    if (!el) return () => {}

    const observer = new ResizeObserver(callback)
    observer.observe(el)

    const cleanup = () => observer.disconnect()
    registerPluginCleanup(plugin, cleanup)
    return cleanup
  }

  function useIntersectionObserver(
    target: Element | string,
    callback: (entries: IntersectionObserverEntry[]) => void,
    options?: IntersectionObserverInit
  ): () => void {
    const el = typeof target === 'string' ? document.querySelector(target) : target
    if (!el) return () => {}

    const observer = new IntersectionObserver(callback, options)
    observer.observe(el)

    const cleanup = () => observer.disconnect()
    registerPluginCleanup(plugin, cleanup)
    return cleanup
  }

  function useAnimationFrame(fn: (time: number) => void): () => void {
    let id = requestAnimationFrame(function frame(time: number) {
      fn(time)
      id = requestAnimationFrame(frame)
    })
    const cleanup = () => cancelAnimationFrame(id)
    registerPluginCleanup(plugin, cleanup)
    return cleanup
  }

  function useIdleCallback(fn: () => void, timeout?: number): () => void {
    if (typeof window.requestIdleCallback !== 'function') {
      const id = setTimeout(fn, timeout || 1)
      const cleanup = () => clearTimeout(id)
      registerPluginCleanup(plugin, cleanup)
      return cleanup
    }
    const id = window.requestIdleCallback(fn, { timeout })
    const cleanup = () => window.cancelIdleCallback(id)
    registerPluginCleanup(plugin, cleanup)
    return cleanup
  }

  function useBeforeUnload(fn: () => void): () => void {
    window.addEventListener('beforeunload', fn)
    const cleanup = () => window.removeEventListener('beforeunload', fn)
    registerPluginCleanup(plugin, cleanup)
    return cleanup
  }

  function useVisibilityChange(options?: { onVisible?: () => void; onHidden?: () => void }): { visibility: Ref<string> } {
    const visibility = ref(document.visibilityState)

    const handler = () => {
      visibility.value = document.visibilityState
      if (visibility.value === 'visible') options?.onVisible?.()
      else options?.onHidden?.()
    }
    document.addEventListener('visibilitychange', handler)

    registerPluginCleanup(plugin, () => {
      document.removeEventListener('visibilitychange', handler)
    })

    return { visibility }
  }

  function useOnlineStatus(): { isOnline: Ref<boolean> } {
    const isOnline = ref(navigator.onLine)

    const onlineHandler = () => { isOnline.value = true }
    const offlineHandler = () => { isOnline.value = false }
    window.addEventListener('online', onlineHandler)
    window.addEventListener('offline', offlineHandler)

    registerPluginCleanup(plugin, () => {
      window.removeEventListener('online', onlineHandler)
      window.removeEventListener('offline', offlineHandler)
    })

    return { isOnline }
  }

  return {
    useCommand,
    useEvent,
    useCleanup,
    useSlot,
    useInterval,
    useTimeout,
    useResizeObserver,
    useIntersectionObserver,
    useAnimationFrame,
    useIdleCallback,
    useBeforeUnload,
    useVisibilityChange,
    useOnlineStatus,
  }
}