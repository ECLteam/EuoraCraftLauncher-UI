import backend from '@/api/client'
import { unwrapResponse as assertSuccess } from '@/app/runtime/errorPresentation'
import { clearLauncherPopupCache } from '@/app/runtime/useLauncherPopupQueue'
import type { DebugMaintenanceResult } from '@/types/system'

export const debugToolsApi = {
  async resetLauncherData(): Promise<DebugMaintenanceResult> {
    const result = assertSuccess(await backend.command('debug_reset_launcher_data'), '安排还原启动器数据')
    clearLauncherPopupCache()
    return result
  },

  async clearPlugins(): Promise<DebugMaintenanceResult> {
    return assertSuccess(await backend.command('debug_clear_plugins'), '安排清理插件')
  },

  /** 打开 WebView 开发者工具（F12 调试窗口） */
  async openDevTools(): Promise<boolean> {
    return (await assertSuccess(await backend.command('debug_devtools_open'), '打开调试窗口')).open
  },
}
