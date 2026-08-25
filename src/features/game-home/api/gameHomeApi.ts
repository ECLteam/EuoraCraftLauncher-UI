import backend from '@/api/client'
import type { InfoCardData } from '@/types/system'

export const gameHomeApi = {
  async getInfoCard(): Promise<InfoCardData> {
    const result = await backend.command('info_card_get')
    if (!result.success || !result.data) {
      throw new Error(result.message || '读取首页信息卡失败')
    }
    return result.data
  },

  async cancelLaunch(): Promise<void> {
    const result = await backend.command('game_launch_cancel')
    if (!result.success) throw new Error(result.message || '取消启动失败')
  },
}
