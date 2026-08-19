import { defineStore, storeToRefs } from 'pinia'
import { readonly, ref } from 'vue'
import { pinia } from '@/app/stores'
import { LAUNCH_MIN_PROGRESS_DURATION, LAUNCH_STAGES } from '@/config/game'

interface LaunchProgressState {
  visible: boolean
  stage: string
  percent: number
  message: string
  cancelable: boolean
  canceled: boolean
}

const STAGES = LAUNCH_STAGES
const PROGRESS_PER_MILLISECOND = 100 / LAUNCH_MIN_PROGRESS_DURATION
const PROGRESS_EPSILON = 0.001

// 每个阶段只放开一段进度。耗时任务会匀速前进到上限，然后等待下一阶段。
const STAGE_PROGRESS_CEILINGS: Partial<Record<keyof typeof STAGES, number>> = {
  prepare: 2,
  preparing: 6,
  account: 9,
  refreshing_microsoft_token: 16,
  validating_authlib_token: 16,
  loading_offline_account: 16,
  account_ready: 19,
  preparing_authlib: 24,
  checking_files: 54,
  files_checked: 56,
  completing_files: 71,
  downloading_assets: 71,
  building_params: 83,
  args_built: 89,
  extracting_natives: 92,
  natives_done: 92,
  about_to_launch: 96,
  launching: 99,
  completed: 100,
  launched: 100,
  success: 100,
}

/**
 * 启动进度全局状态（Pinia）。
 * 由 useLaunchProgress() 包装暴露，保持原有 API（progress.value.visible 等）。
 */
export const useLaunchProgressStore = defineStore('launchProgress', () => {
  const state = ref<LaunchProgressState>({
    visible: false,
    stage: '',
    percent: 0,
    message: '',
    cancelable: true,
    canceled: false,
  })
  const smoothPercent = ref(0)

  // 非响应式内部状态（动画句柄/进度上限/延迟隐藏标记）
  let progressCeiling = 0
  let animFrameId: number | null = null
  let hideRequested = false

  function stopAnimLoop() {
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId)
      animFrameId = null
    }
  }

  function hideImmediately() {
    stopAnimLoop()
    hideRequested = false
    state.value.visible = false
    state.value.canceled = false
  }

  function applyPercent(percent: number) {
    smoothPercent.value = percent
    state.value.percent = percent
  }

  function finishAnimationIfNeeded() {
    if (hideRequested && smoothPercent.value >= 100 - PROGRESS_EPSILON) {
      hideImmediately()
    }
  }

  function startAnimLoop() {
    if (animFrameId !== null || !state.value.visible || smoothPercent.value < 0) return

    let previousTime = performance.now()
    const step = (time: number) => {
      const elapsed = Math.max(0, time - previousTime)
      previousTime = time
      const current = smoothPercent.value
      const destination = progressCeiling

      if (current >= destination - PROGRESS_EPSILON) {
        applyPercent(destination)
        animFrameId = null
        finishAnimationIfNeeded()
        return
      }

      applyPercent(Math.min(destination, current + elapsed * PROGRESS_PER_MILLISECOND))
      if (smoothPercent.value >= destination - PROGRESS_EPSILON) {
        applyPercent(destination)
        animFrameId = null
        finishAnimationIfNeeded()
        return
      }

      animFrameId = requestAnimationFrame(step)
    }
    animFrameId = requestAnimationFrame(step)
  }

  function show(options?: { cancelable?: boolean }) {
    stopAnimLoop()
    progressCeiling = STAGE_PROGRESS_CEILINGS.prepare ?? 0
    hideRequested = false
    applyPercent(0)
    state.value = {
      visible: true,
      stage: STAGES.prepare,
      percent: 0,
      message: '',
      cancelable: options?.cancelable ?? true,
      canceled: false,
    }
    startAnimLoop()
  }

  function hide() {
    // 启动已经完成但动画尚未走满时，延迟隐藏以保证固定的最短展示时长。
    if (progressCeiling >= 100 && smoothPercent.value < 100 - PROGRESS_EPSILON) {
      hideRequested = true
      startAnimLoop()
      return
    }
    hideImmediately()
  }

  function cancel() {
    stopAnimLoop()
    hideRequested = false
    state.value.canceled = true
    state.value.visible = false
    state.value.percent = 0
    state.value.stage = STAGES.error
    state.value.message = '已取消'
  }

  function setProgress(percent: number, stageKey?: keyof typeof STAGES, message?: string) {
    if (state.value.canceled) return

    const clamped = percent < 0 ? percent : Math.min(100, Math.max(0, percent))
    const resolvedStage = stageKey ? STAGES[stageKey] || stageKey : state.value.stage
    const stageCeiling = stageKey ? STAGE_PROGRESS_CEILINGS[stageKey] : undefined

    if (clamped < 0 || stageKey === 'error') {
      progressCeiling = clamped
      hideRequested = false
      applyPercent(clamped)
    } else if (stageKey === 'completed' || stageKey === 'launched' || stageKey === 'success') {
      // 后端已确认 Java 进程创建成功时立即收束。平滑动画只用于真实后端阶段之间，
      // 不能为了补足固定时长让"启动成功"后的进度条继续运行。
      progressCeiling = 100
      applyPercent(100)
      stopAnimLoop()
    } else {
      // 后端进度只放开上限；显示值始终按固定速度前进，且不会回退。
      progressCeiling = Math.max(progressCeiling, smoothPercent.value, clamped, stageCeiling ?? clamped)
    }

    if (stageKey) {
      state.value.stage = resolvedStage
      if (stageKey === 'completed' || stageKey === 'launched' || stageKey === 'success') {
        state.value.cancelable = false
      }
    }
    if (message !== undefined) {
      state.value.message = message
    }
    startAnimLoop()
  }

  function setStage(stageKey: keyof typeof STAGES | string) {
    if (state.value.canceled) return
    state.value.stage = STAGES[stageKey as keyof typeof STAGES] || stageKey
  }

  function setMessage(message: string) {
    if (state.value.canceled) return
    state.value.message = message
  }

  return {
    state,
    smoothPercent,
    show,
    hide,
    cancel,
    setProgress,
    setStage,
    setMessage,
    STAGES,
  }
})

/** 启动进度组合式 API（保持原有返回形状：progress.value.visible 等） */
export function useLaunchProgress() {
  const store = useLaunchProgressStore(pinia)
  const { state, smoothPercent } = storeToRefs(store)
  return {
    progress: readonly(state),
    smoothPercent: readonly(smoothPercent),
    show: store.show,
    hide: store.hide,
    cancel: store.cancel,
    setProgress: store.setProgress,
    setStage: store.setStage,
    setMessage: store.setMessage,
    STAGES: store.STAGES,
  }
}

// 全局单例导出，方便跨组件使用
export const globalLaunchProgress = useLaunchProgress()
