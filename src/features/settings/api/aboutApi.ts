import backend from '@/api/client'
import type { LauncherInfo } from '@/types/system'

export const aboutApi = {
  async getLauncherInfo(): Promise<LauncherInfo | null> {
    if (!backend.runtime.isDesktop) return null

    const result = await backend.command('launcher_info')
    if (!result.success || !result.data) return null
    return result.data
  },
}
