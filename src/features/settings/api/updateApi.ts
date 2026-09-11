import backend from '@/api/client'
import type { UpdateApplyResult, UpdateCheckResult, UpdateDownloadResult, UpdateStatus } from '@/types/system'

export const updateApi = {
  async checkUpdate(): Promise<UpdateCheckResult | null> {
    if (!backend.runtime.isDesktop) return null

    const result = await backend.command('launcher_check_update')
    if (!result.success || !result.data) return null
    return result.data as UpdateCheckResult
  },

  async updateStatus(): Promise<UpdateStatus | null> {
    if (!backend.runtime.isDesktop) return null

    const result = await backend.command('launcher_update_status')
    if (!result.success || !result.data) return null
    return result.data as UpdateStatus
  },

  async downloadUpdate(): Promise<UpdateDownloadResult | null> {
    if (!backend.runtime.isDesktop) return null

    const result = await backend.command('launcher_update_download')
    if (!result.success || !result.data) return null
    return result.data as UpdateDownloadResult
  },

  async applyUpdate(): Promise<UpdateApplyResult | null> {
    if (!backend.runtime.isDesktop) return null

    const result = await backend.command('launcher_update_apply')
    if (!result.success || !result.data) return null
    return result.data as UpdateApplyResult
  },
}
