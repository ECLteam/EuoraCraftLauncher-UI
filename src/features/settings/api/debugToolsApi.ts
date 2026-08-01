import backend from '@/api/client'
import { clearLauncherPopupCache } from '@/app/runtime/useLauncherPopupQueue'
import type { DebugMaintenanceResult } from '@/types/api'

function assertSuccess(
  result: { success: boolean; data?: DebugMaintenanceResult; message?: string },
  operation: string
): DebugMaintenanceResult {
  if (!result.success || !result.data) {
    throw new Error(result.message || `${operation}失败`)
  }
  return result.data
}

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
