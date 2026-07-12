// plugin-sdk 事件系统

import backend from '@/api/client'

type EventHandler = (payload: unknown) => void

interface ListenerEntry {
  handler: EventHandler
  cleanup: () => void
}

const registry = new Map<string, Map<string, ListenerEntry>>()

function makeKey(): string {
  return `_auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function listen(event: string, handler: EventHandler, key?: string): () => void {
  const id = key || makeKey()
  const handlers = registry.get(event) ?? new Map()
  registry.set(event, handlers)

  const cleanup = backend.on(event, handler)
  handlers.set(id, { handler, cleanup })

  return () => {
    cleanup()
    handlers.delete(id)
    if (handlers.size === 0) registry.delete(event)
  }
}

export function unlisten(event: string, key?: string): void {
  const handlers = registry.get(event)
  if (!handlers) return
  if (key) {
    const item = handlers.get(key)
    if (item) {
      item.cleanup()
      handlers.delete(key)
    }
  } else {
    for (const item of handlers.values()) {
      item.cleanup()
    }
    handlers.clear()
  }
  if (handlers.size === 0) registry.delete(event)
}

export function cleanup(): void {
  for (const handlers of registry.values()) {
    for (const item of handlers.values()) {
      item.cleanup()
    }
    handlers.clear()
  }
  registry.clear()
}

export function once(event: string, handler: EventHandler): () => void {
  let disposed = false
  const dispose = listen(event, (payload) => {
    if (disposed) return
    disposed = true
    dispose()
    handler(payload)
  })
  return dispose
}

export const Events = {
  PLUGIN_ENABLED: 'plugin:enabled',
  PLUGIN_DISABLED: 'plugin:disabled',
  SETTINGS_CHANGED: 'plugin:settings_changed',
  SETTINGS_REGISTERED: 'plugin:settings_registered',
  ROUTE_REGISTERED: 'plugin:route_registered',
  ROUTE_UNREGISTERED: 'plugin:route_unregistered',
  HTML_INJECTED: 'plugin:html_injected',
  SCRIPT_INJECTED: 'plugin:script_injected',
  TYPESCRIPT_INJECTED: 'plugin:typescript_injected',
  SLOTS_CLEARED: 'plugin:slots_cleared',
  PRE_UNLOAD: 'plugin:pre_unload',
  CLEANUP: 'plugin:cleanup',
  LAUNCHER_NOTIFY: 'launcher:notify',
} as const
