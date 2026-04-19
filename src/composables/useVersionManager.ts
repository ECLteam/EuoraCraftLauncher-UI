import { ref, reactive } from 'vue'
import { api } from '@/utils/api'
import { useGlassMessage } from './useGlassMessage'
import { globalLaunchProgress } from './useLaunchProgress'

export interface VersionItem {
  id: string
  type: string
}

export function useVersionManager(t: (key: string, ...args: any[]) => string) {
  const message = useGlassMessage()
  const { show, hide, setProgress } = globalLaunchProgress

  const versions = ref<VersionItem[]>([])
  const selectedVersion = ref<string>('')
  const loading = ref(false)
  const launching = ref(false)
  const statusMsg = ref<string>('')
  const statusType = ref<'info' | 'success' | 'error'>('info')

  async function loadVersions() {
    loading.value = true
    try {
      const configRes = await api.getGameConfig()
      if (!configRes.success || !configRes.data?.minecraft_paths?.length) {
        showStatus(t('game.status.noGameDir'), 'error')
        return
      }

      const stringPaths = configRes.data.minecraft_paths.map((path: any) =>
        typeof path === 'string' ? path : path.path
      )
      const scanRes = await api.scanVersions(stringPaths)
      if (scanRes.success && scanRes.data) {
        versions.value = scanRes.data
          .filter((v: any) => v.status === 'success')
          .map((v: any) => ({ id: v.folder, type: v.loader_type || 'Vanilla' }))

        if (versions.value.length > 0 && !selectedVersion.value) {
          selectedVersion.value = versions.value[0].id
        }
        showStatus(t('game.status.foundVersions', { count: versions.value.length }), 'success')
      } else {
        showStatus(t('game.status.scanFailed'), 'error')
      }
    } catch (e) {
      showStatus(t('game.status.fetchFailed'), 'error')
    } finally {
      loading.value = false
    }
  }

  function selectVersion(id: string) {
    selectedVersion.value = id
  }

  async function launchGame(currentAccount: { id: string } | null, gamePath?: string) {
    if (!selectedVersion.value) {
      showStatus(t('game.status.selectVersionFirst'), 'error')
      return
    }

    if (!currentAccount) {
      showStatus(t('game.status.noAccount'), 'error')
      message.error(t('game.status.noAccount'))
      return
    }

    launching.value = true
    showStatus(t('game.status.launching'), 'info')

    // 【待对接】启动功能暂不可用
    glassMessage.info('启动功能待对接')
    console.warn('[API] launchInstance 待对接')
    launching.value = false
  }

  function showStatus(msg: string, type: 'info' | 'success' | 'error' = 'info') {
    statusMsg.value = msg
    statusType.value = type
    setTimeout(() => {
      if (statusMsg.value === msg) {
        statusMsg.value = ''
      }
    }, 5000)
  }

  return reactive({
    versions,
    selectedVersion,
    loading,
    launching,
    statusMsg,
    statusType,
    loadVersions,
    selectVersion,
    launchGame,
    showStatus
  })
}
