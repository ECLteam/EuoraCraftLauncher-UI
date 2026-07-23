import backend from '@/api/client'
import type { BackendEventName, BackendEvents, PluginRoute, PluginSlotItem } from '@/types/api'

export const pluginHostApi = {
  async getRoutes(): Promise<PluginRoute[]> {
    const result = await backend.command('plugin_get_routes')
    if (!result.success) throw new Error(result.message || '读取插件路由失败')
    return result.data ?? []
  },

  async getSlots(): Promise<Record<string, PluginSlotItem[]>> {
    const result = await backend.command('plugin_get_slots')
    if (!result.success) throw new Error(result.message || '读取插件插槽失败')
    return result.data ?? {}
  },

  callCommand(command: string, params?: Record<string, unknown>) {
    return backend.command('plugin_call_command', { command, params })
  },

  subscribe<E extends BackendEventName>(event: E, handler: (payload: BackendEvents[E]) => void): () => void {
    return backend.on(event, handler)
  },
}
