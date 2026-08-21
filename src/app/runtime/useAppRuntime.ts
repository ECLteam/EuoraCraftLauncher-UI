import { computed, readonly, ref, type Ref } from 'vue'
import backend from '@/api/client'
import { initPluginBridge, destroyPluginBridge, scopePluginCss } from '@/composables/usePluginBridge'
import { globalTaskQueue } from '@/composables/useTaskQueue'
import { initTheme } from '@/composables/useTheme'
import { i18n, supportedLocales } from '@/i18n'
import type { BackendEvents, DownloadConfig, GameConfig, InstallProgress } from '@/types/api'
import { getErrorMessage } from '@/utils/error'
import { launcherErrorQueue } from './errorPresentation'
import { installDesktopInteractionPolicy } from './interactionPolicy'
import { useLauncherPopupQueue } from './useLauncherPopupQueue'
import type { Router } from 'vue-router'

interface MessageService {
  warning(message: string, options?: number | { title?: string; duration?: number }): unknown
  info(message: string, options?: number | { title?: string; duration?: number }): unknown
  error(message: string, options?: number | { title?: string; duration?: number }): unknown
}

interface UseAppRuntimeOptions {
  router: Router
  t: (key: string) => string
  message: MessageService
  markAgreementNotAccepted: () => void
  showAgreementModal: Ref<boolean>
}

export function useAppRuntime(options: UseAppRuntimeOptions) {
  const isDevMode = ref(false)
  const launcherVersion = ref('')
  const launcherVersionType = ref<'dev' | 'beta' | 'release'>('release')
  const gameConfig = ref<GameConfig | null>(null)
  const downloadConfig = ref<DownloadConfig | null>(null)

  const popupQueue = useLauncherPopupQueue()
  const showErrorModal = launcherErrorQueue.visible
  const errorTitle = computed(() => {
    const error = launcherErrorQueue.activeError.value
    return error?.kind === 'game_crash' ? options.t('error.crash.title') : (error?.title ?? '')
  })
  const errorMessage = computed(() => {
    const error = launcherErrorQueue.activeError.value
    if (error?.kind !== 'game_crash' || !error.crash) return error?.message ?? ''
    const key = error.crash.detectedBy.includes('manual') ? 'error.crash.manualMessage' : 'error.crash.autoMessage'
    return i18n.global.t(key, {
      version: error.crash.versionId,
      exitCode: error.crash.exitCode ?? i18n.global.t('error.crash.unknown'),
    })
  })
  const errorDetail = computed(() => launcherErrorQueue.activeError.value?.detail ?? '')
  const errorId = computed(() => launcherErrorQueue.activeError.value?.error_id ?? '')
  const errorKind = computed(() => launcherErrorQueue.activeError.value?.kind)
  const crashAnalysis = computed(() => launcherErrorQueue.activeError.value?.crash)

  const cleanupCallbacks: Array<() => void> = []
  let started = false
  let syncingPendingErrors = false

  async function applyConfig(payload: BackendEvents['config:init']): Promise<void> {
    const launcher = payload.launcher
    if (launcher) {
      isDevMode.value = launcher.debug === true
      launcherVersion.value = launcher.version || ''
      launcherVersionType.value = launcher.version_type || 'release'
    }

    if (payload.game) gameConfig.value = payload.game
    if (payload.download) downloadConfig.value = payload.download

    const ui = payload.ui
    if (!ui) return
    if (ui.locale) {
      const locale = supportedLocales.find(({ code }) => code === ui.locale)?.code
      if (locale) {
        i18n.global.locale.value = locale
        document.documentElement.setAttribute('lang', locale)
      }
    }
    try {
      await initTheme(ui)
    } catch (error) {
      options.message.warning(`界面配置加载失败：${getErrorMessage(error)}`, 10000)
    }
  }

  function getSubtaskLabel(subtask: string): string {
    const labels: Record<string, string> = {
      download_json: options.t('task.subtask.downloadJson'),
      download_assets: options.t('task.subtask.downloadAssets'),
      check_files: options.t('task.subtask.checkFiles'),
    }
    return labels[subtask] || subtask
  }

  function handleInstallProgress(payload: InstallProgress): void {
    const taskId = payload.task_id
    if (!taskId) return

    const phase = payload.phase || ''
    const message = payload.message || ''
    const done = payload.done ?? 0
    const total = payload.total ?? 1
    const subtask = payload.subtask || ''
    const progressType =
      payload.progress_type === 'bytes' || payload.progress_type === 'files' ? payload.progress_type : undefined

    if (phase === 'done') {
      globalTaskQueue.updateTask(taskId, {
        status: 'completed',
        progress: 100,
        message: message || '安装完成',
        progressType,
        done,
        total,
        totalFiles: payload.total_files,
        downloadedFiles: payload.downloaded_files,
        speed: 0,
      })
    } else if (phase === 'error') {
      globalTaskQueue.updateTask(taskId, {
        status: 'error',
        message: message || '安装失败',
        progressType,
        done,
        total,
        totalFiles: payload.total_files,
        downloadedFiles: payload.downloaded_files,
        speed: 0,
      })
    } else {
      // 所有阶段按 done/total 线性计算真实进度，下载阶段使用字节/文件进度
      const progress = total > 0 ? Math.round((done / total) * 100) : 3
      globalTaskQueue.updateTask(taskId, {
        status: 'running',
        progress: Math.max(1, Math.min(100, progress)),
        message,
        progressType,
        done,
        total,
        totalFiles: payload.total_files,
        downloadedFiles: payload.downloaded_files,
        speed: payload.speed,
      })
    }

    if (subtask) {
      globalTaskQueue.addSubtask(taskId, {
        id: subtask,
        name: getSubtaskLabel(subtask),
        status: phase === 'done' ? 'completed' : phase === 'error' ? 'error' : 'running',
        message,
      })
    }
  }

  function registerBackendEvents(): void {
    cleanupCallbacks.push(
      backend.on('launcher:notify', (payload) => {
        const messageOptions = { title: payload.title, duration: 8000 }
        if (payload.type === 'warning') options.message.warning(payload.message, messageOptions)
        if (payload.type === 'info') options.message.info(payload.message, messageOptions)
        if (payload.type === 'error') options.message.error(payload.message, messageOptions)
      }),
      backend.on('launcher:agreement_required', () => {
        options.markAgreementNotAccepted()
        options.showAgreementModal.value = true
      }),
      backend.on('launcher:error', (payload) => {
        launcherErrorQueue.enqueue(payload)
      }),
      backend.on('launcher:popup', popupQueue.enqueuePopup),
      backend.on('config:init', (payload) => {
        if (backend.isShowcaseActive) return
        void applyConfig(payload)
      }),
      backend.on('config:updated', (payload) => {
        if (payload.section !== 'launcher') return
        const launcher = (payload.data as { debug?: boolean } | null) ?? {}
        isDevMode.value = launcher.debug === true
      }),
      backend.on('plugin:css_injected', (payload) => {
        const pluginName = payload.plugin || 'unknown'
        const styleKey =
          payload.key !== null && payload.key !== undefined ? encodeURIComponent(payload.key) : crypto.randomUUID()
        const id = `plugin-css-${pluginName}-${styleKey}`
        let styleElement = document.getElementById(id) as HTMLStyleElement | null
        if (!styleElement) {
          styleElement = document.createElement('style')
          styleElement.id = id
          styleElement.setAttribute('data-plugin', pluginName)
          document.head.appendChild(styleElement)
        }
        styleElement.textContent = scopePluginCss(pluginName, payload.css || '')
      }),
      backend.on('game:install_progress', handleInstallProgress)
    )
  }

  async function notifyFrontendReady(): Promise<void> {
    await options.router.isReady()
    await document.fonts.ready
    const result = await backend.command('frontend_ready')
    if (!result.success) console.error('[AppRuntime] 通知后端前端已就绪失败:', result.message)
  }

  async function syncPendingErrors(): Promise<void> {
    if (syncingPendingErrors || backend.isShowcaseActive) return
    syncingPendingErrors = true
    try {
      const result = await backend.command('launcher_errors_pending')
      if (!result.success || !Array.isArray(result.data) || result.data.length === 0) return
      const errorIds: string[] = []
      for (const error of result.data) {
        launcherErrorQueue.enqueue(error)
        if (error.error_id) errorIds.push(error.error_id)
      }
      if (errorIds.length > 0) {
        await backend.command('launcher_errors_ack', { error_ids: errorIds })
      }
    } finally {
      syncingPendingErrors = false
    }
  }

  async function loadInitialConfig(): Promise<void> {
    const result = await backend.config.getMany(['launcher', 'game', 'download', 'ui'])
    if (result.success && result.data) {
      await applyConfig(result.data as unknown as BackendEvents['config:init'])
    } else if (!result.success) {
      options.message.warning(result.message || '读取启动器配置失败', 10000)
    }
  }

  async function start(): Promise<void> {
    if (started || !backend.runtime.isAvailable) return
    started = true

    // 必须在 registerBackendEvents 之前检查展示模式，
    // 否则 notifyFrontendReady 后后端发送的 config:init 事件会先于 swap 被处理
    const launcherResult = await backend.config.get('launcher')
    if (launcherResult.success && (launcherResult.data as Record<string, unknown>)?.showcase === true) {
      backend.swapToShowcase()
    }

    registerBackendEvents()
    cleanupCallbacks.push(installDesktopInteractionPolicy(readonly(isDevMode)))
    initPluginBridge(options.router)
    await backend.waitForEventListeners()
    await loadInitialConfig()
    await notifyFrontendReady()
    await syncPendingErrors()
    // 启动时同步一次积压错误；此后依赖 launcher:error 事件实时推送，低频轮询仅作兜底
    const pendingErrorTimer = window.setInterval(() => void syncPendingErrors(), 1_000)
    cleanupCallbacks.push(() => window.clearInterval(pendingErrorTimer))
  }

  function stop(): void {
    if (!started) return
    cleanupCallbacks.splice(0).forEach((cleanup) => cleanup())
    destroyPluginBridge()
    started = false
  }

  return {
    runtimeMode: backend.runtime.modeState,
    isShowcaseMode: backend.runtime.isShowcaseState,
    isDevMode: readonly(isDevMode),
    launcherVersion: readonly(launcherVersion),
    launcherVersionType: readonly(launcherVersionType),
    gameConfig: readonly(gameConfig),
    downloadConfig: readonly(downloadConfig),
    showErrorModal,
    errorTitle: readonly(errorTitle),
    errorMessage: readonly(errorMessage),
    errorDetail: readonly(errorDetail),
    errorId: readonly(errorId),
    errorKind,
    crashAnalysis,
    dismissActiveError: launcherErrorQueue.dismissActive,
    activePopup: popupQueue.activePopup,
    popupVisible: popupQueue.popupVisible,
    dismissActivePopup: popupQueue.dismissActivePopup,
    start,
    stop,
  }
}
