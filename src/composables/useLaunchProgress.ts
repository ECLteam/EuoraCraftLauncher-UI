import { ref, readonly } from 'vue'

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

const STAGES = {
  prepare: '准备启动...',
  checking_files: '检查游戏文件完整性...',
  completing_files: '补全缺失文件...',
  downloading_assets: '下载游戏资源...',
  building_params: '构建启动参数...',
  extracting_natives: '解压原生库...',
  launching: '启动游戏进程...',
  completed: '启动成功！',
  success: '启动成功！',
  error: '启动失败',
}

export function useLaunchProgress() {
  const show = (options?: { cancelable?: boolean }) => {
    state.value = {
      visible: true,
      stage: STAGES.prepare,
      percent: 0,
      message: '',
      cancelable: options?.cancelable ?? true,
      canceled: false,
    }
  }

  const hide = () => {
    state.value.visible = false
    state.value.canceled = false
  }

  const cancel = () => {
    state.value.canceled = true
    state.value.visible = false
    state.value.percent = 0
    state.value.stage = STAGES.error
    state.value.message = '已取消'
  }

  const setProgress = (percent: number, stageKey?: keyof typeof STAGES, message?: string) => {
    // 已取消则忽略进度更新
    if (state.value.canceled) return
    state.value.percent = Math.max(0, Math.min(100, percent))
    if (stageKey) {
      state.value.stage = STAGES[stageKey] || stageKey
    }
    if (message !== undefined) {
      state.value.message = message
    }
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
