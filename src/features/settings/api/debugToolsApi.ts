import backend from '@/api/client'
import { unwrapResponse as assertSuccess } from '@/app/runtime/errorPresentation'
import { clearLauncherPopupCache } from '@/app/runtime/useLauncherPopupQueue'
import type { DebugMaintenanceResult } from '@/types/api'

export const debugToolsApi = {
  async resetLauncherData(): Promise<DebugMaintenanceResult> {
    const result = assertSuccess(await backend.command('debug_reset_launcher_data'), '安排还原启动器数据')
    clearLauncherPopupCache()
    return result
  },

  async clearPlugins(): Promise<DebugMaintenanceResult> {
    return assertSuccess(await backend.command('debug_clear_plugins'), '安排清理插件')
  },
}
