import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import backend from '@/api/client'
import {
  LAUNCH_PROGRESS,
  LAUNCH_SUCCESS_HIDE_DELAY,
  LAUNCH_ERROR_HIDE_DELAY,
  STATUS_MESSAGE_AUTO_HIDE,
} from '@/config/game'
import { instanceInstallApi } from '@/features/instances/api/instanceInstallApi'
import { instanceSettingsApi } from '@/features/instances/api/instanceSettingsApi'
import { createDefaultVersionSettings, parseLaunchArguments } from '@/features/instances/model/instanceSettings'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'
import type { ScannedVersion, LaunchProgress } from '@/types/api'
import { useGlassMessage } from './useGlassMessage'
import { globalLaunchProgress } from './useLaunchProgress'

export interface VersionItem {
  id: string
  type: string
  versionType: ScannedVersion['versionType']
  gamePath: string
}

const globalVersions = ref<VersionItem[]>([])
const globalSelectedVersion = ref<string>('')
const currentGamePath = ref<string>('')

export function useInstanceManager(t: (key: string, ...args: unknown[]) => string) {
  const message = useGlassMessage()
  const router = useRouter()
  const settingsStore = useSettingsStore()
  const { show: showLaunchProgress, hide: hideLaunchProgress, setProgress: setLaunchProgress } = globalLaunchProgress

  const versions = globalVersions
  const selectedVersion = globalSelectedVersion
  const loading = ref(false)
  const launching = ref(false)
  const statusMsg = ref<string>('')
  const statusType = ref<'info' | 'success' | 'error'>('info')

  async function loadVersions() {
    loading.value = true
    try {
      await settingsStore.load()
    } catch {
      loading.value = false
      showStatus(t('game.status.scanFailed'), 'error')
      return
    }
    const minecraftPaths = settingsStore.game.minecraft_paths ?? []
    if (!minecraftPaths.length) {
      loading.value = false
      showStatus(t('game.status.noGameDir'), 'error')
      return
    }

    const stringPaths = [...new Set(minecraftPaths.map((path) => (typeof path === 'string' ? path : path.path)))]
    let scannedVersions: ScannedVersion[]
    try {
      scannedVersions = await instanceInstallApi.scan(stringPaths)
    } catch {
      loading.value = false
      showStatus(t('game.status.scanFailed'), 'error')
      return
    }
    loading.value = false

    const seen = new Set<string>()
    versions.value = scannedVersions
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

    const selected =
      versions.value.find(
        (version) => version.id === selectedVersion.value && version.gamePath === currentGamePath.value
      ) ??
      versions.value.find((version) => version.id === selectedVersion.value) ??
      versions.value[0]
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
        setLaunchProgress(typeof pct === 'number' ? pct : LAUNCH_PROGRESS.preparing!, 'preparing', msg)
      } else if (phase === 'account') {
        setLaunchProgress(typeof pct === 'number' ? pct : LAUNCH_PROGRESS.account!, 'account', msg)
      } else if (phase === 'microsoft_token') {
        setLaunchProgress(
          typeof pct === 'number' ? pct : LAUNCH_PROGRESS.microsoft_token!,
          'refreshing_microsoft_token',
          msg
        )
      } else if (phase === 'authlib_token') {
        setLaunchProgress(
          typeof pct === 'number' ? pct : LAUNCH_PROGRESS.authlib_token!,
          'validating_authlib_token',
          msg
        )
      } else if (phase === 'offline_account') {
        setLaunchProgress(
          typeof pct === 'number' ? pct : LAUNCH_PROGRESS.offline_account!,
          'loading_offline_account',
          msg
        )
      } else if (phase === 'account_ready') {
        setLaunchProgress(typeof pct === 'number' ? pct : LAUNCH_PROGRESS.account_ready!, 'account_ready', msg)
      } else if (phase === 'authlib') {
        setLaunchProgress(typeof pct === 'number' ? pct : LAUNCH_PROGRESS.authlib!, 'preparing_authlib', msg)
      } else if (phase === 'downloading' && typeof pct === 'number') {
        setLaunchProgress(pct, 'downloading_assets', msg)
      } else if (phase === 'checking') {
        setLaunchProgress(typeof pct === 'number' ? pct : LAUNCH_PROGRESS.checking!, 'checking_files', msg)
      } else if (phase === 'files_checked') {
        setLaunchProgress(typeof pct === 'number' ? pct : LAUNCH_PROGRESS.files_checked!, 'files_checked', msg)
      } else if (phase === 'building_args') {
        setLaunchProgress(typeof pct === 'number' ? pct : LAUNCH_PROGRESS.building_args!, 'building_params', msg)
      } else if (phase === 'args_built') {
        setLaunchProgress(typeof pct === 'number' ? pct : LAUNCH_PROGRESS.args_built!, 'args_built', msg)
      } else if (phase === 'natives_done') {
        setLaunchProgress(LAUNCH_PROGRESS.natives_done!, 'natives_done', msg)
      } else if (phase === 'about_to_launch') {
        setLaunchProgress(typeof pct === 'number' ? pct : LAUNCH_PROGRESS.about_to_launch!, 'about_to_launch', msg)
      } else if (phase === 'launching') {
        setLaunchProgress(typeof pct === 'number' ? pct : LAUNCH_PROGRESS.launching!, 'launching', msg)
      } else {
        setLaunchProgress(2, 'prepare', msg)
      }
    })

    setLaunchProgress(0, 'prepare', `正在准备启动 ${selectedVersion.value}...`)

    let versionSettings = createDefaultVersionSettings()
    try {
      versionSettings = await instanceSettingsApi.get({
        versionId: selectedVersion.value,
        path: currentGamePath.value,
      })
    } catch (error) {
      console.warn('[VersionSettings] 读取版本独立设置失败，将使用全局设置:', error)
    }

    const launchResult = await backend.command('launch_instance', {
      version_id: selectedVersion.value,
      game_path: currentGamePath.value,
      java_path: versionSettings.customJava ? versionSettings.javaPath || undefined : undefined,
      memory: versionSettings.customMemory ? versionSettings.memory : undefined,
      jvm_args: versionSettings.jvmArgs ? parseLaunchArguments(versionSettings.jvmArgs) : undefined,
      game_args: versionSettings.gameArgs ? parseLaunchArguments(versionSettings.gameArgs) : undefined,
      version_isolation: versionSettings.isolated,
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
    currentGamePath,
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
