import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import backend from '@/api/client'
import {
  LAUNCH_PROGRESS,
  DOWNLOAD_BASE_PROGRESS,
  DOWNLOAD_PROGRESS_SCALE,
  LAUNCH_SUCCESS_HIDE_DELAY,
  LAUNCH_ERROR_HIDE_DELAY,
  STATUS_MESSAGE_AUTO_HIDE,
} from '@/config/game'
import { useGlassMessage } from './useGlassMessage'
import { globalLaunchProgress } from './useLaunchProgress'
import type { ScannedVersion, LaunchProgress, GameConfig } from '@/types/api'

export interface VersionItem {
  id: string
  type: string
  versionType: ScannedVersion['versionType']
  gamePath: string
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
        const gamePath = getVersionGamePath(v, stringPaths[0] ?? '')
        const key = `${gamePath}\0${id}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map((v: ScannedVersion) => ({
        id: v.versionId || v.id,
        type: v.primaryLoader || 'Vanilla',
        versionType: v.versionType,
        gamePath: getVersionGamePath(v, stringPaths[0] ?? ''),
      }))

    const selected = versions.value.find((version) =>
      version.id === selectedVersion.value && version.gamePath === currentGamePath.value
    ) ?? versions.value.find((version) => version.id === selectedVersion.value)
      ?? versions.value[0]
    if (selected) {
      selectVersion(selected.id, selected.gamePath)
    } else {
      selectedVersion.value = ''
      currentGamePath.value = ''
    }

    showStatus(t('game.status.foundVersions', { count: versions.value.length }), 'success')
  }

  function getVersionGamePath(version: ScannedVersion, fallback: string): string {
    if (version.path) return version.path
    const pathMatch = version.jsonPath?.match(/^(.*)[\\/]versions[\\/]/i)
    return pathMatch?.[1] || fallback
  }

  function selectVersion(id: string, gamePath?: string) {
    selectedVersion.value = id
    const selected = gamePath
      ? versions.value.find((version) => version.id === id && version.gamePath === gamePath)
      : versions.value.find((version) => version.id === id)
    currentGamePath.value = selected?.gamePath || gamePath || currentGamePath.value
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
        setTimeout(hideLaunchProgress, LAUNCH_SUCCESS_HIDE_DELAY)
        unlisten()
      } else if (phase === 'error') {
        setLaunchProgress(0, 'error', msg)
        setTimeout(hideLaunchProgress, LAUNCH_ERROR_HIDE_DELAY)
        unlisten()
      } else if (phase === 'preparing') {
        setLaunchProgress(LAUNCH_PROGRESS.preparing!, 'preparing', msg)
      } else if (phase === 'downloading' && typeof pct === 'number') {
        setLaunchProgress(DOWNLOAD_BASE_PROGRESS + pct * DOWNLOAD_PROGRESS_SCALE, 'downloading_assets', msg)
      } else if (phase === 'checking') {
        setLaunchProgress(LAUNCH_PROGRESS.checking!, 'checking_files', msg)
      } else if (phase === 'files_checked') {
        setLaunchProgress(LAUNCH_PROGRESS.files_checked!, 'files_checked', msg)
      } else if (phase === 'building_args') {
        setLaunchProgress(typeof pct === 'number' ? pct : LAUNCH_PROGRESS.building_args!, 'building_params', msg)
      } else if (phase === 'args_built') {
        setLaunchProgress(LAUNCH_PROGRESS.args_built!, 'args_built', msg)
      } else if (phase === 'natives_done') {
        setLaunchProgress(LAUNCH_PROGRESS.natives_done!, 'natives_done', msg)
      } else if (phase === 'about_to_launch') {
        setLaunchProgress(LAUNCH_PROGRESS.about_to_launch!, 'about_to_launch', msg)
      } else if (phase === 'launching') {
        setLaunchProgress(typeof pct === 'number' ? pct : LAUNCH_PROGRESS.launching!, 'launching', msg)
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
    }, STATUS_MESSAGE_AUTO_HIDE)
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
