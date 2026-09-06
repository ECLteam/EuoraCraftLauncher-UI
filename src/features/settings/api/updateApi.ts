import backend from '@/api/client'
import type { UpdateCheckResult } from '@/types/system'

export const updateApi = {
  async checkUpdate(): Promise<UpdateCheckResult | null> {
    if (!backend.runtime.isDesktop) return null

    const result = await backend.command('launcher_check_update')
    if (!result.success || !result.data) return null
    return result.data as UpdateCheckResult
  },
}
