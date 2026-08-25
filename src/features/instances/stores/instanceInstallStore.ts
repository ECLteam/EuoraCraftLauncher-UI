import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { queryClient } from '@/app/queryClient'
import { queryKeys } from '@/app/queryKeys'
import { instanceInstallApi, type InstallableLoader } from '@/features/instances/api/instanceInstallApi'
import type { CommandPayloadMap } from '@/types/api'

export const useInstanceInstallStore = defineStore('version-install', () => {
  const loaderVersions = reactive<Record<InstallableLoader, string[]>>({
    fabric: [],
    forge: [],
    neoforge: [],
    quilt: [],
  })
  const fabricApiVersions = ref<string[]>([])
  const fabricApiVersionsLoading = ref(false)
  const loaderVersionsLoading = ref(false)
  const installingVersionId = ref<string | null>(null)
  let loaderRequestId = 0
  let fabricApiRequestId = 0

  const isInstalling = computed(() => installingVersionId.value !== null)

  async function loadLoaderVersions(loader: InstallableLoader, gameVersion: string): Promise<string[]> {
    if (!gameVersion) {
      loaderVersions[loader] = []
      return []
    }
    const requestId = ++loaderRequestId
    loaderVersionsLoading.value = true
    try {
      const result = (
        await queryClient.fetchQuery({
          queryKey: queryKeys.instanceInstall.loaderVersions(loader, gameVersion),
          queryFn: () => instanceInstallApi.getLoaderVersions(loader, gameVersion),
        })
      ).slice(0, 20)
      if (requestId === loaderRequestId) loaderVersions[loader] = result
      return result
    } finally {
      if (requestId === loaderRequestId) loaderVersionsLoading.value = false
    }
  }

  async function loadFabricApiVersions(gameVersion: string): Promise<string[]> {
    if (!gameVersion) {
      fabricApiVersions.value = []
      return []
    }
    const requestId = ++fabricApiRequestId
    fabricApiVersionsLoading.value = true
    try {
      const result = (
        await queryClient.fetchQuery({
          queryKey: queryKeys.instanceInstall.fabricApiVersions(gameVersion),
          queryFn: () => instanceInstallApi.getFabricApiVersions(gameVersion),
        })
      ).slice(0, 20)
      if (requestId === fabricApiRequestId) fabricApiVersions.value = result
      return result
    } finally {
      if (requestId === fabricApiRequestId) fabricApiVersionsLoading.value = false
    }
  }

  function clearLoaderVersions(): void {
    loaderVersions.fabric = []
    loaderVersions.forge = []
    loaderVersions.neoforge = []
    loaderVersions.quilt = []
    fabricApiVersions.value = []
  }

  function hasVersionConflict(gamePath: string, versionName: string): Promise<boolean> {
    return instanceInstallApi.exists(`${gamePath}/versions/${versionName}`)
  }

  async function install(versionId: string, params: CommandPayloadMap['game_install']): Promise<void> {
    installingVersionId.value = versionId
    try {
      await instanceInstallApi.install(params)
    } finally {
      installingVersionId.value = null
    }
  }

  return {
    loaderVersions,
    fabricApiVersions,
    fabricApiVersionsLoading,
    loaderVersionsLoading,
    installingVersionId,
    isInstalling,
    loadLoaderVersions,
    loadFabricApiVersions,
    clearLoaderVersions,
    hasVersionConflict,
    install,
  }
})
