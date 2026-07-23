import backend from '@/api/client'
import type { PluginInfo } from '@/types/api'

function assertSuccess<T>(result: { success: boolean; data?: T; message?: string }, operation: string): T {
  if (!result.success) throw new Error(result.message || `${operation}失败`)
  return result.data as T
}

export const pluginManagementApi = {
  async list(): Promise<PluginInfo[]> {
    return assertSuccess(await backend.command('plugin_list'), '读取插件列表') ?? []
  },

  async enable(pluginName: string): Promise<void> {
    assertSuccess(await backend.command('plugin_enable', { plugin_name: pluginName }), '启用插件')
  },

  async disable(pluginName: string): Promise<void> {
    assertSuccess(await backend.command('plugin_disable', { plugin_name: pluginName }), '禁用插件')
  },

  async reload(pluginName: string): Promise<void> {
    assertSuccess(await backend.command('plugin_reload', { plugin_name: pluginName }), '重载插件')
  },

  async unload(pluginName: string): Promise<void> {
    assertSuccess(await backend.command('plugin_unload', { plugin_name: pluginName }), '卸载插件')
  },

  async installFromDirectory(): Promise<boolean> {
    const selected = await backend.command('select_directory')
    if (!selected.success) throw new Error(selected.message || '选择插件目录失败')
    if (!selected.data?.path) return false
    assertSuccess(await backend.command('plugin_install', { plugin_path: selected.data.path }), '安装插件')
    return true
  },

  onStatusChanged(handler: () => void): () => void {
    return backend.on('plugin:status_changed', handler)
  },
}
