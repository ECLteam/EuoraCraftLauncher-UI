import { computed, onMounted, ref } from 'vue'
import backend from '@/api/client'
import { unwrapResponse } from '@/app/runtime/errorPresentation'
import { useInstanceStore } from '@/features/instances/stores/instanceStore'
import type { ScannedVersion } from '@/types/api'

/** 安装位置缓存键：在线资源类型 + 存档（存档仅本地导入）。 */
export type InstallTargetKey = string

/** 用 path\u0000versionId 拼接的实例唯一键，与现存各页选择器一致。 */
export function instanceKey(version: Pick<ScannedVersion, 'path' | 'versionId'>): string {
  return `${version.path}\u0000${version.versionId}`
}

export function parseInstanceKey(key: string): { path: string; versionId: string } {
  const [path = '', versionId = ''] = key.split('\u0000')
  return { path, versionId }
}

export function useResourceInstallTarget(resourceType: InstallTargetKey) {
  const instanceStore = useInstanceStore()
  const selectedKey = ref('')
  const ready = ref(false)

  const installableInstances = computed<ScannedVersion[]>(() =>
    instanceStore.scannedVersions.filter((version) => !version.isBroken)
  )

  const selectedInstance = computed<ScannedVersion | null>(
    () => installableInstances.value.find((version) => instanceKey(version) === selectedKey.value) ?? null
  )

  async function loadCache(): Promise<void> {
    await instanceStore.loadAll()
    const config = unwrapResponse(await backend.config.get('download'), '读取下载设置')
    const cfg = config as { resourceInstallCache?: Record<string, { gamePath: string; versionId: string }> }
    const cached = cfg?.resourceInstallCache?.[resourceType]
    if (cached?.gamePath && cached?.versionId) {
      const hit = installableInstances.value.find(
        (version) => version.path === cached.gamePath && version.versionId === cached.versionId
      )
      if (hit) {
        selectedKey.value = instanceKey(hit)
        ready.value = true
        return
      }
    }
    const preferred =
      installableInstances.value.find(
        (version) =>
          version.versionId === instanceStore.selectedVersion && version.path === instanceStore.currentGamePath
      ) ?? installableInstances.value[0]
    selectedKey.value = preferred ? instanceKey(preferred) : ''
    ready.value = true
  }

  function setTarget(version: ScannedVersion): void {
    selectedKey.value = instanceKey(version)
  }

  async function persist(): Promise<void> {
    const instance = selectedInstance.value
    if (!instance) return
    const current = (unwrapResponse(await backend.config.get('download'), '读取下载设置') ?? {}) as {
      resourceInstallCache?: Record<string, { gamePath: string; versionId: string }>
    }
    await backend.config.set('download', {
      ...current,
      resourceInstallCache: {
        ...(current.resourceInstallCache ?? {}),
        [resourceType]: { gamePath: instance.path, versionId: instance.versionId },
      },
    })
  }

  onMounted(() => {
    void loadCache()
  })

  return {
    ready,
    installableInstances,
    selectedKey,
    selectedInstance,
    setTarget,
    persist,
    loadCache,
  }
}
