import backend from '@/api/client'
import { unwrapResponse as assertSuccess } from '@/app/runtime/errorPresentation'
import type { CrashAnalysisResult, CrashCandidateFile, GameInstance, GameInstancesChangedEvent, VersionRunStats } from '@/types/instances'

export const instanceRuntimeApi = {
  async list(): Promise<GameInstance[]> {
    return assertSuccess(await backend.command('game_instances'), '读取运行实例') ?? []
  },

  async stop(instanceId: string): Promise<void> {
    assertSuccess(await backend.command('game_instance_stop', { instance_id: instanceId }), '停止实例')
  },

  async getStats(gamePath: string, versionId: string): Promise<VersionRunStats> {
    return assertSuccess(
      await backend.command('game_version_stats', { game_path: gamePath, version_id: versionId }),
      '读取版本运行统计'
    )
  },

  async listCrashCandidates(gamePath: string, versionId: string): Promise<CrashCandidateFile[]> {
    return (
      assertSuccess(
        await backend.command('game_crash_list', { game_path: gamePath, version_id: versionId }),
        '读取崩溃日志候选'
      ) ?? []
    )
  },

  async analyzeCrash(filePath: string, gamePath: string, versionId: string): Promise<CrashAnalysisResult> {
    return assertSuccess(
      await backend.command('game_crash_analyze', {
        file_path: filePath,
        game_path: gamePath,
        version_id: versionId,
      }),
      '分析崩溃日志'
    )
  },

  onChanged(handler: (payload: GameInstancesChangedEvent) => void): () => void {
    return backend.on('game:instances_changed', handler)
  },
}
