import backend from '@/api/client'
import type { GameInstance, GameInstancesChangedEvent, VersionRunStats } from '@/types/api'

function assertSuccess<T>(result: { success: boolean; data?: T; message?: string }, operation: string): T {
  if (!result.success) throw new Error(result.message || `${operation}失败`)
  return result.data as T
}

export const instanceRuntimeApi = {
  async list(): Promise<GameInstance[]> {
    return assertSuccess(await backend.command('game_instances'), '读取运行实例') ?? []
  },

  async stop(instanceId: string): Promise<void> {
    assertSuccess(await backend.command('game_instance_stop', { instance_id: instanceId }), '通知实例退出')
  },

  async getStats(gamePath: string, versionId: string): Promise<VersionRunStats> {
    return assertSuccess(
      await backend.command('game_version_stats', { game_path: gamePath, version_id: versionId }),
      '读取版本运行统计'
    )
  },

  onChanged(handler: (payload: GameInstancesChangedEvent) => void): () => void {
    return backend.on('game:instances_changed', handler)
  },
}
