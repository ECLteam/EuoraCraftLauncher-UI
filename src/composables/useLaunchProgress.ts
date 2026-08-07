import { readonly, ref } from 'vue'
import { LAUNCH_MIN_PROGRESS_DURATION, LAUNCH_STAGES } from '@/config/game'

interface LaunchProgressState {
  visible: boolean
  stage: string
  percent: number
  message: string
  cancelable: boolean
  canceled: boolean
}

const state = ref<LaunchProgressState>({
  visible: false,
  stage: '',
  percent: 0,
  message: '',
  cancelable: true,
  canceled: false,
})

const STAGES = LAUNCH_STAGES
const PROGRESS_PER_MILLISECOND = 100 / LAUNCH_MIN_PROGRESS_DURATION
const PROGRESS_EPSILON = 0.001

let _progressCeiling = 0
let _animFrameId: number | null = null
let _hideRequested = false
const _smoothPercent = ref(0)

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

function _stopAnimLoop() {
  if (_animFrameId !== null) {
    cancelAnimationFrame(_animFrameId)
    _animFrameId = null
  }
}

function _hideImmediately() {
  _stopAnimLoop()
  _hideRequested = false
  state.value.visible = false
  state.value.canceled = false
}

function _applyPercent(percent: number) {
  _smoothPercent.value = percent
  state.value.percent = percent
}

function _finishAnimationIfNeeded() {
  if (_hideRequested && _smoothPercent.value >= 100 - PROGRESS_EPSILON) {
    _hideImmediately()
  }
}

function _startAnimLoop() {
  if (_animFrameId !== null || !state.value.visible || _smoothPercent.value < 0) return

  let previousTime = performance.now()
  const step = (time: number) => {
    const elapsed = Math.max(0, time - previousTime)
    previousTime = time
    const current = _smoothPercent.value
    const destination = _progressCeiling

    if (current >= destination - PROGRESS_EPSILON) {
      _applyPercent(destination)
      _animFrameId = null
      _finishAnimationIfNeeded()
      return
    }

    _applyPercent(Math.min(destination, current + elapsed * PROGRESS_PER_MILLISECOND))
    if (_smoothPercent.value >= destination - PROGRESS_EPSILON) {
      _applyPercent(destination)
      _animFrameId = null
      _finishAnimationIfNeeded()
      return
    }

    _animFrameId = requestAnimationFrame(step)
  }
  _animFrameId = requestAnimationFrame(step)
}

export function useLaunchProgress() {
  const show = (options?: { cancelable?: boolean }) => {
    _stopAnimLoop()
    _progressCeiling = STAGE_PROGRESS_CEILINGS.prepare ?? 0
    _hideRequested = false
    _applyPercent(0)
    state.value = {
      visible: true,
      stage: STAGES.prepare,
      percent: 0,
      message: '',
      cancelable: options?.cancelable ?? true,
      canceled: false,
    }
    _startAnimLoop()
  }

  const hide = () => {
    // 启动已经完成但动画尚未走满时，延迟隐藏以保证固定的最短展示时长。
    if (_progressCeiling >= 100 && _smoothPercent.value < 100 - PROGRESS_EPSILON) {
      _hideRequested = true
      _startAnimLoop()
      return
    }
    _hideImmediately()
  }

  const cancel = () => {
    _stopAnimLoop()
    _hideRequested = false
    state.value.canceled = true
    state.value.visible = false
    state.value.percent = 0
    state.value.stage = STAGES.error
    state.value.message = '已取消'
  }

  const setProgress = (percent: number, stageKey?: keyof typeof STAGES, message?: string) => {
    if (state.value.canceled) return

    const clamped = percent < 0 ? percent : Math.min(100, Math.max(0, percent))
    const resolvedStage = stageKey ? STAGES[stageKey] || stageKey : state.value.stage
    const stageCeiling = stageKey ? STAGE_PROGRESS_CEILINGS[stageKey] : undefined

    if (clamped < 0 || stageKey === 'error') {
      _progressCeiling = clamped
      _hideRequested = false
      _applyPercent(clamped)
    } else {
      // 后端进度只放开上限；显示值始终按固定速度前进，且不会回退。
      _progressCeiling = Math.max(_progressCeiling, _smoothPercent.value, clamped, stageCeiling ?? clamped)
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
    _startAnimLoop()
  }

  const setStage = (stageKey: keyof typeof STAGES | string) => {
    if (state.value.canceled) return
    state.value.stage = STAGES[stageKey as keyof typeof STAGES] || stageKey
  }

  const setMessage = (message: string) => {
    if (state.value.canceled) return
    state.value.message = message
  }

  return {
    progress: readonly(state),
    smoothPercent: readonly(_smoothPercent),
    show,
    hide,
    cancel,
    setProgress,
    setStage,
    setMessage,
    STAGES,
  }
}

// 全局单例导出，方便跨组件使用
export const globalLaunchProgress = useLaunchProgress()
