import { ref, readonly } from 'vue'
import { LAUNCH_STAGES } from '@/config/game'

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

// 平滑动画
let _targetPercent = 0
let _animFrameId: number | null = null
const _smoothPercent = ref(0)

function _startAnimLoop() {
  if (_animFrameId !== null) return
  const step = () => {
    const current = _smoothPercent.value
    const target = _targetPercent
    if (Math.abs(current - target) < 0.3) {
      _smoothPercent.value = target
      _animFrameId = null
      return
    }
    // ease-out: 每帧走剩余距离的 15%，最低 0.3 确保不卡死
    const delta = (target - current) * 0.15
    const stepVal = Math.abs(delta) < 0.3 ? (target > current ? 0.3 : -0.3) : delta
    _smoothPercent.value = current + stepVal
    _animFrameId = requestAnimationFrame(step)
  }
  _animFrameId = requestAnimationFrame(step)
}

function _stopAnimLoop() {
  if (_animFrameId !== null) {
    cancelAnimationFrame(_animFrameId)
    _animFrameId = null
  }
}

export function useLaunchProgress() {
  const show = (options?: { cancelable?: boolean }) => {
    _stopAnimLoop()
    _targetPercent = 0
    _smoothPercent.value = 0
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
    _stopAnimLoop()
    state.value.visible = false
    state.value.canceled = false
  }

  const cancel = () => {
    _stopAnimLoop()
    state.value.canceled = true
    state.value.visible = false
    state.value.percent = 0
    state.value.stage = STAGES.error
    state.value.message = '已取消'
  }

  const setProgress = (percent: number, stageKey?: keyof typeof STAGES, message?: string) => {
    if (state.value.canceled) return
    const clamped = percent < 0 ? percent : Math.min(100, Math.max(0, percent))
    _targetPercent = clamped
    // 同步更新 state.percent 用于兼容旧逻辑
    state.value.percent = _smoothPercent.value
    if (stageKey) {
      state.value.stage = STAGES[stageKey] || stageKey
    }
    if (message !== undefined) {
      state.value.message = message
    }
    // 100% 或 error 时直接跳到目标值，不做动画
    if (clamped >= 100) {
      _smoothPercent.value = clamped
      _stopAnimLoop()
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