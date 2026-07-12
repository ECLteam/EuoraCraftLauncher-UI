import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import backend from '@/api/client'
import { useGlassMessage } from './useGlassMessage'
import { globalLaunchProgress } from './useLaunchProgress'
import type { ScannedVersion, LaunchProgress, GameConfig } from '@/types/api'

export interface VersionItem {
  id: string
  type: string
}

const globalVersions = ref<VersionItem[]>([])
const globalSelectedVersion = ref<string>('')
const currentGamePath = ref<string>('')

export function useVersionManager(t: (key: string, ...args: unknown[]) => string) {
  const message = useGlassMessage()
  const router = useRouter()
  const { show: showLaunchProgress, hide: hideLaunchProgress, setProgress: setLaunchProgress } = globalLaunchProgress

  const versions = globalVersions
  const selectedVersion = globalSelectedVersion
  const loading = ref(false)
  const launching = ref(false)
  const statusMsg = ref<string>('')
  const statusType = ref<'info' | 'success' | 'error'>('info')

  async function loadVersions() {
    loading.value = true
    const configRes = await backend.config.get<GameConfig>('game')
    const minecraftPaths = configRes.data?.minecraft_paths ?? []
    if (!minecraftPaths.length) {
      loading.value = false
      showStatus(t('game.status.noGameDir'), 'error')
      return
    }

    const stringPaths = [...new Set(minecraftPaths.map((path) =>
      typeof path === 'string' ? path : path.path
    ))]
    const scanRes = await backend.command('scan_versions', { path: stringPaths })
    loading.value = false
    if (!scanRes.success || !scanRes.data) {
      showStatus(t('game.status.scanFailed'), 'error')
      return
    }

    const seen = new Set<string>()
    versions.value = scanRes.data
      .filter((v: ScannedVersion) => !v.isBroken)
      .filter((v: ScannedVersion) => {
        const id = v.versionId || v.id
        if (seen.has(id)) return false
        seen.add(id)
        return true
      })
      .map((v: ScannedVersion) => ({ id: v.versionId || v.id, type: v.primaryLoader || 'Vanilla' }))

    if (versions.value.length > 0 && !selectedVersion.value) {
      selectedVersion.value = versions.value[0].id
    }

    if (stringPaths.length > 0) {
      currentGamePath.value = stringPaths[0]
    }

    showStatus(t('game.status.foundVersions', { count: versions.value.length }), 'success')
  }

  function selectVersion(id: string) {
    selectedVersion.value = id
  }

  function setGamePath(path: string) {
    currentGamePath.value = path
  }

  async function launchGame(currentAccount: { id: string } | null) {
    if (!selectedVersion.value) {
      showStatus(t('game.status.selectVersionFirst'), 'error')
      return
    }

    if (!currentAccount) {
      showStatus(t('game.status.noAccount'), 'error')
      message.error(t('game.status.noAccount'))
      return
    }

    if (!currentGamePath.value) {
      showStatus(t('game.status.noGamePath'), 'error')
      message.error(t('game.status.noGamePath'))
      return
    }

    launching.value = true
    showStatus(t('game.status.launching'), 'info')

    router.push({ name: 'game' })
    showLaunchProgress({ cancelable: true })

    const unlisten = backend.on('game:launch_progress', (payload: LaunchProgress) => {
      if (globalLaunchProgress.progress.value.canceled) {
        unlisten()
        return
      }

      const phase = payload?.phase || ''
      const msg = payload?.message || ''
      const pct = payload?.percent

      if (phase === 'launched') {
        setLaunchProgress(100, 'success', msg)
        setTimeout(hideLaunchProgress, 1500)
        unlisten()
      } else if (phase === 'error') {
        setLaunchProgress(0, 'error', msg)
        setTimeout(hideLaunchProgress, 2000)
        unlisten()
      } else if (phase === 'preparing') {
        setLaunchProgress(3, 'preparing', msg)
      } else if (phase === 'downloading' && typeof pct === 'number') {
        setLaunchProgress(10 + pct * 0.38, 'downloading_assets', msg)
      } else if (phase === 'checking') {
        setLaunchProgress(5, 'checking_files', msg)
      } else if (phase === 'files_checked') {
        setLaunchProgress(50, 'files_checked', msg)
      } else if (phase === 'building_args') {
        setLaunchProgress(typeof pct === 'number' ? pct : 65, 'building_params', msg)
      } else if (phase === 'args_built') {
        setLaunchProgress(75, 'args_built', msg)
      } else if (phase === 'natives_done') {
        setLaunchProgress(85, 'natives_done', msg)
      } else if (phase === 'about_to_launch') {
        setLaunchProgress(92, 'about_to_launch', msg)
      } else if (phase === 'launching') {
        setLaunchProgress(typeof pct === 'number' ? pct : 95, 'launching', msg)
      } else {
        setLaunchProgress(2, 'prepare', msg)
      }
    })

    setLaunchProgress(0, 'prepare', `正在准备启动 ${selectedVersion.value}...`)

    const launchResult = await backend.command('launch_instance', {
      version_id: selectedVersion.value,
      game_path: currentGamePath.value,
    })

    unlisten()
    launching.value = false

    if (!launchResult.success) {
      const isCanceled = launchResult.message === '启动已取消'
      if (isCanceled) {
        setLaunchProgress(0, 'error', '已取消')
      } else if (!globalLaunchProgress.progress.value.canceled) {
        setLaunchProgress(0, 'error', launchResult.message || '启动失败')
        message.error(launchResult.message || '启动失败')
      }
      setTimeout(hideLaunchProgress, 2000)
      return
    }

    if (!globalLaunchProgress.progress.value.canceled) {
      setLaunchProgress(100, 'launched', `游戏 ${selectedVersion.value} 已启动`)
      message.success(`游戏 ${selectedVersion.value} 已启动`)
    }
    setTimeout(hideLaunchProgress, 1500)
  }

  let statusId = 0
  function showStatus(msg: string, type: 'info' | 'success' | 'error' = 'info') {
    const id = ++statusId
    statusMsg.value = msg
    statusType.value = type
    setTimeout(() => {
      if (statusId === id) {
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
    setGamePath,
    showStatus,
  })
}
