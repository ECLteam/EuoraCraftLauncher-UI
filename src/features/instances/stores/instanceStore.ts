import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { normalizeGamePath, instanceInstallApi } from '@/features/instances/api/instanceInstallApi'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'
import type { ScannedVersion } from '@/types/api'

export interface VersionItem {
  id: string
  type: string
  versionType: ScannedVersion['versionType']
  gamePath: string
}

export const useInstanceStore = defineStore('versions', () => {
  const settingsStore = useSettingsStore()
  const scannedVersions = ref<ScannedVersion[]>([])
  const selectedVersion = ref('')
  const currentGamePath = ref('')
  const loadingCount = ref(0)
  const scanRequests = new Map<string, Promise<ScannedVersion[]>>()
  let stopWatching: (() => void) | null = null

  const loading = computed(() => loadingCount.value > 0)
  const versions = computed<VersionItem[]>(() =>
    scannedVersions.value
      .filter((version) => !version.isBroken)
      .map((version) => ({
        id: version.versionId,
        type: version.primaryLoader,
        versionType: version.versionType,
        gamePath: version.path,
      }))
  )

  function startWatching(): void {
    if (stopWatching) return
    stopWatching = instanceInstallApi.onVersionsChanged(({ gamePath }) => {
      void scanPath(gamePath)
    })
  }

  function replacePathVersions(path: string, versionsForPath: ScannedVersion[]): void {
    const key = normalizeGamePath(path)
    scannedVersions.value = [
      ...scannedVersions.value.filter((version) => normalizeGamePath(version.path) !== key),
      ...versionsForPath.map((version) => ({ ...version, path })),
    ]
  }

  async function scanPath(path: string, force = false): Promise<ScannedVersion[]> {
    startWatching()
    const key = normalizeGamePath(path)
    const existing = scanRequests.get(key)
    if (existing && !force) return existing
    if (existing) await existing.catch(() => undefined)

    loadingCount.value += 1
    const request = instanceInstallApi
      .scan([path], { force })
      .then((result) => {
        replacePathVersions(path, result)
        return result
      })
      .finally(() => {
        scanRequests.delete(key)
        loadingCount.value = Math.max(0, loadingCount.value - 1)
      })
    scanRequests.set(key, request)
    return request
  }

  async function loadAll(force = false): Promise<void> {
    startWatching()
    await settingsStore.load()
    const paths = settingsStore.game.minecraft_paths.map((entry) => (typeof entry === 'string' ? entry : entry.path))
    if (paths.length === 0) {
      scannedVersions.value = []
      selectedVersion.value = ''
      currentGamePath.value = ''
      return
    }

    loadingCount.value += 1
    try {
      scannedVersions.value = await instanceInstallApi.scan(paths, { force })
      const selected =
        versions.value.find(
          (version) => version.id === selectedVersion.value && version.gamePath === currentGamePath.value
        ) ?? versions.value[0]
      if (selected) {
        selectVersion(selected.id, selected.gamePath)
      } else {
        selectedVersion.value = ''
        currentGamePath.value = ''
      }
    } finally {
      loadingCount.value = Math.max(0, loadingCount.value - 1)
    }
  }

  function selectVersion(versionId: string, gamePath?: string): void {
    const selected = gamePath
      ? versions.value.find((version) => version.id === versionId && version.gamePath === gamePath)
      : versions.value.find((version) => version.id === versionId)
    if (!selected) return
    selectedVersion.value = selected.id
    currentGamePath.value = selected.gamePath
  }

  function setGamePath(path: string): void {
    currentGamePath.value = path
  }

  function removePath(path: string): void {
    const key = normalizeGamePath(path)
    scannedVersions.value = scannedVersions.value.filter((version) => normalizeGamePath(version.path) !== key)
    instanceInstallApi.invalidateScanCache(path)
    if (normalizeGamePath(currentGamePath.value) === key) {
      const next = versions.value[0]
      selectedVersion.value = next?.id ?? ''
      currentGamePath.value = next?.gamePath ?? ''
    }
  }

  return {
    scannedVersions,
    versions,
    selectedVersion,
    currentGamePath,
    loading,
    loadAll,
    scanPath,
    selectVersion,
    setGamePath,
    removePath,
  }
})
