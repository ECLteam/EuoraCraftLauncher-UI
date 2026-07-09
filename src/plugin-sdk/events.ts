/**
 * plugin-sdk 事件系统
 * 插件开发者可订阅/发布插件事件。
 */

import backend from '@/api/client'

type EventHandler = (payload: any) => void

// ── 事件订阅管理 ──

const _handlers = new Map<string, Map<string, EventHandler>>()

/**
 * 监听插件事件。
 * @param event - 事件名（如 "plugin:settings_changed", "plugin:enabled" 等）
 * @param handler - 事件处理函数
 * @param key - 可选的唯一标识，用于后续取消监听
 * @returns 取消监听的函数
 */
export function listen(event: string, handler: EventHandler, key?: string): () => void {
  const id = key || `_auto_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  if (!_handlers.has(event)) {
    _handlers.set(event, new Map())
  }
  _handlers.get(event)!.set(id, handler)

  const unlisten = backend.on(event, handler)

  return () => {
    unlisten()
    const map = _handlers.get(event)
    if (map) {
      map.delete(id)
      if (map.size === 0) _handlers.delete(event)
    }
  }
}

/**
 * 取消插件事件监听。
 * @param event - 事件名
 * @param key - 监听时的唯一标识，不传则移除该事件的所有监听
 */
export function unlisten(event: string, key?: string): void {
  if (key) {
    const map = _handlers.get(event)
    if (map) {
      const handler = map.get(key)
      if (handler) {
        backend.off(event, handler)
        map.delete(key)
      }
      if (map.size === 0) _handlers.delete(event)
    }
  } else {
    // 移除该事件的所有监听
    const map = _handlers.get(event)
    if (map) {
      for (const handler of map.values()) {
        backend.off(event, handler)
      }
      _handlers.delete(event)
    }
  }
}

/**
 * 移除当前插件的所有事件监听。
 * 在插件卸载时调用。
 */
export function cleanup(): void {
  for (const [event, map] of _handlers) {
    for (const handler of map.values()) {
      backend.off(event, handler)
    }
  }
  _handlers.clear()
}

// ── 常用事件名常量 ──

export const Events = {
  /** 插件已启用 */
  PLUGIN_ENABLED: 'plugin:enabled',
  /** 插件已禁用 */
  PLUGIN_DISABLED: 'plugin:disabled',
  /** 插件设置已变更 */
  SETTINGS_CHANGED: 'plugin:settings_changed',
  /** 设置已注册 */
  SETTINGS_REGISTERED: 'plugin:settings_registered',
  /** 路由已注册 */
  ROUTE_REGISTERED: 'plugin:route_registered',
  /** 路由已注销 */
  ROUTE_UNREGISTERED: 'plugin:route_unregistered',
  /** HTML 已注入 */
  HTML_INJECTED: 'plugin:html_injected',
  /** 脚本已注入 */
  SCRIPT_INJECTED: 'plugin:script_injected',
  /** TypeScript 已注入 */
  TYPESCRIPT_INJECTED: 'plugin:typescript_injected',
  /** 插槽已清理 */
  SLOTS_CLEARED: 'plugin:slots_cleared',
  /** 插件预卸载 */
  PRE_UNLOAD: 'plugin:pre_unload',
  /** 插件清理 */
  CLEANUP: 'plugin:cleanup',
  /** 启动器通知 */
  LAUNCHER_NOTIFY: 'launcher:notify',
} as const