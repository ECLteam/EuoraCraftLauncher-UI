import { readonly, ref, type Ref } from 'vue'
import backend from '@/api/client'
import { initPluginBridge, destroyPluginBridge } from '@/composables/usePluginBridge'
import { globalTaskQueue } from '@/composables/useTaskQueue'
import { initTheme } from '@/composables/useTheme'
import { i18n, supportedLocales } from '@/i18n'
import type { BackendEvents, DownloadConfig, GameConfig, InstallProgress } from '@/types/api'
import { installDesktopInteractionPolicy } from './interactionPolicy'
import { useLauncherPopupQueue } from './useLauncherPopupQueue'
import type { Router } from 'vue-router'

interface MessageService {
  warning(message: string, duration?: number): unknown
  info(message: string, duration?: number): unknown
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

  const showErrorModal = ref(false)
  const errorTitle = ref('')
  const errorMessage = ref('')
  const errorDetail = ref('')
  const errorId = ref('')
  const popupQueue = useLauncherPopupQueue()

  const cleanupCallbacks: Array<() => void> = []
  let started = false

  function applyConfig(payload: BackendEvents['config:init']): void {
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
    void initTheme(ui)
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

    if (phase === 'done') {
      globalTaskQueue.updateTask(taskId, { status: 'completed', progress: 100, message: message || '安装完成' })
    } else if (phase === 'error') {
      globalTaskQueue.updateTask(taskId, { status: 'error', message: message || '安装失败' })
    } else {
      const progress = phase === 'download' && total > 0 ? Math.round((done / total) * 100) : 3
      globalTaskQueue.updateTask(taskId, {
        status: 'running',
        progress: Math.max(phase === 'download' ? 5 : 3, progress),
        message,
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
        if (payload.type === 'warning') options.message.warning(payload.message, 8000)
        if (payload.type === 'info') options.message.info(payload.message, 8000)
      }),
      backend.on('launcher:agreement_required', () => {
        options.markAgreementNotAccepted()
        options.showAgreementModal.value = true
      }),
      backend.on('launcher:error', (payload) => {
        errorTitle.value = payload.title || ''
        errorMessage.value = payload.message || ''
        errorDetail.value = payload.detail || ''
        errorId.value = payload.error_id || ''
        showErrorModal.value = true
      }),
      backend.on('launcher:popup', popupQueue.enqueuePopup),
      backend.on('config:init', (payload) => {
        if (backend.isShowcaseActive) return
        applyConfig(payload)
      }),
      backend.on('plugin:css_injected', (payload) => {
        const pluginName = payload.plugin || 'unknown'
        const id = `plugin-css-${pluginName}`
        let styleElement = document.getElementById(id) as HTMLStyleElement | null
        if (!styleElement) {
          styleElement = document.createElement('style')
          styleElement.id = id
          styleElement.setAttribute('data-plugin', pluginName)
          document.head.appendChild(styleElement)
        }
        styleElement.textContent = payload.css || ''
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

  async function loadInitialConfig(): Promise<void> {
    const result = await backend.config.getMany(['launcher', 'game', 'download', 'ui'])
    if (result.success && result.data) {
      applyConfig(result.data as unknown as BackendEvents['config:init'])
    }
  }

  async function start(): Promise<void> {
    if (started || !backend.runtime.isAvailable) return
    started = true

    // 必须在 registerBackendEvents 之前检查展示模式，
    // 否则 notifyFrontendReady 后后端发送的 config:init 事件会先于 swap 被处理
    const launcherResult = await backend.config.get('launcher')
    if (launcherResult.success && (launcherResult.data as Record<string, any>)?.showcase) {
      backend.swapToShowcase()
    }

    registerBackendEvents()
    cleanupCallbacks.push(installDesktopInteractionPolicy(readonly(isDevMode)))
    initPluginBridge(options.router)
    await backend.waitForEventListeners()
    await notifyFrontendReady()
    await loadInitialConfig()
  }

  function stop(): void {
    if (!started) return
    cleanupCallbacks.splice(0).forEach((cleanup) => cleanup())
    destroyPluginBridge()
    started = false
  }

  return {
    runtimeMode: backend.runtime.mode,
    isShowcaseMode: backend.runtime.isShowcase,
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
    activePopup: popupQueue.activePopup,
    popupVisible: popupQueue.popupVisible,
    dismissActivePopup: popupQueue.dismissActivePopup,
    start,
    stop,
  }
}
