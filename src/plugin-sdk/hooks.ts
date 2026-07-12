// 插件生命周期钩子，按插件名隔离

import backend from '@/api/client'
import type {
  BackendEventName,
  BackendEvents,
  CommandName,
  CommandPayloadMap,
} from '@/types/api'
import type { CleanupFn } from './types'

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
    try { fn() } catch {}
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

  return { useCommand, useEvent, useCleanup, useSlot }
}
