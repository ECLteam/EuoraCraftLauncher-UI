import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import backend from '@/api/client'
import { useGlassMessage } from './useGlassMessage'
import { globalLaunchProgress } from './useLaunchProgress'

export interface VersionItem {
  id: string
  type: string
}

// 全局共享状态，确保游戏页和版本管理页选择同步
const globalVersions = ref<VersionItem[]>([])
const globalSelectedVersion = ref<string>('')

export function useVersionManager(t: (key: string, ...args: any[]) => string) {
  const message = useGlassMessage()
  const router = useRouter()
  const { show: showLaunchProgress, hide: hideLaunchProgress, setProgress: setLaunchProgress, cancel: cancelLaunchProgress } = globalLaunchProgress

  const versions = globalVersions
  const selectedVersion = globalSelectedVersion
  const loading = ref(false)
  const launching = ref(false)
  const statusMsg = ref<string>('')
  const statusType = ref<'info' | 'success' | 'error'>('info')

  // 存储当前游戏路径，用于启动
  let currentGamePath = ''

  async function loadVersions(gamePath?: string) {
    loading.value = true
    try {
      const configRes = await backend.config.get('game')
      const minecraftPaths = configRes.data?.minecraft_paths ?? []
      if (!minecraftPaths.length) {
        showStatus(t('game.status.noGameDir'), 'error')
        return
      }

      const stringPaths = minecraftPaths.map((path: any) =>
        typeof path === 'string' ? path : path.path
      )
      const scanRes = await backend.command('scan_versions', { path: stringPaths })
      if (scanRes.success && scanRes.data) {
        versions.value = scanRes.data
          .filter((v: any) => !v.isBroken)
          .map((v: any) => ({ id: v.versionId || v.id, type: v.primaryLoader || 'Vanilla' }))

        if (versions.value.length > 0 && !selectedVersion.value) {
          selectedVersion.value = versions.value[0].id
        }

        // 记录第一个游戏路径
        if (stringPaths.length > 0) {
          currentGamePath = stringPaths[0]
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

  function setGamePath(path: string) {
    currentGamePath = path
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

    if (!currentGamePath) {
      showStatus('未找到游戏路径', 'error')
      message.error('未找到游戏路径')
      return
    }

    launching.value = true
    showStatus(t('game.status.launching'), 'info')

    // 跳转到游戏页面
    router.push({ name: 'game' })

    showLaunchProgress({ cancelable: true })

    // 监听启动进度事件
    const unlisten = backend.on('game:launch_progress', (payload: any) => {
      // 已取消则忽略后续事件
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
      } else if (phase === 'downloading' && typeof pct === 'number') {
        setLaunchProgress(Math.max(15, pct), 'downloading_assets', msg)
      } else if (phase === 'checking') {
        setLaunchProgress(-1, 'checking_files', msg)
      } else if (phase === 'building_args') {
        setLaunchProgress(typeof pct === 'number' ? pct : 90, 'building_params', msg)
      } else if (phase === 'launching') {
        setLaunchProgress(typeof pct === 'number' ? pct : 95, 'launching', msg)
      } else {
        setLaunchProgress(-1, 'prepare' as any, msg)
      }
    })

    try {
      setLaunchProgress(0, 'prepare', `正在准备启动 ${selectedVersion.value}...`)

      const launchResult = await backend.command('launch_instance', {
        version_id: selectedVersion.value,
        game_path: currentGamePath,
      })

      if (!launchResult.success) {
        const isCanceled = launchResult.message === '启动已取消'
        if (isCanceled) {
          setLaunchProgress(0, 'error', '已取消')
        } else if (!globalLaunchProgress.progress.value.canceled) {
          setLaunchProgress(0, 'error', launchResult.message || '启动失败')
          message.error(launchResult.message || '启动失败')
        }
        setTimeout(hideLaunchProgress, 2000)
        unlisten()
        return
      }

      if (!globalLaunchProgress.progress.value.canceled) {
        setLaunchProgress(100, 'launched', `游戏 ${selectedVersion.value} 已启动`)
        message.success(`游戏 ${selectedVersion.value} 已启动`)
      }
      setTimeout(hideLaunchProgress, 1500)
      unlisten()
    } catch (e) {
      console.error('启动失败:', e)
      if (!globalLaunchProgress.progress.value.canceled) {
        setLaunchProgress(0, 'error', '启动过程中发生错误')
        message.error('启动过程中发生错误')
      }
      setTimeout(hideLaunchProgress, 2000)
      unlisten()
    } finally {
      launching.value = false
    }
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
    setGamePath,
    showStatus,
  })
}
