import { ref, readonly } from 'vue'

interface LaunchProgressState {
  visible: boolean
  stage: string
  percent: number
  message: string
  cancelable: boolean
}

const state = ref<LaunchProgressState>({
  visible: false,
  stage: '',
  percent: 0,
  message: '',
  cancelable: true,
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
    }
  }

  const hide = () => {
    state.value.visible = false
  }

  const setProgress = (percent: number, stageKey?: keyof typeof STAGES, message?: string) => {
    state.value.percent = Math.max(0, Math.min(100, percent))
    if (stageKey) {
      state.value.stage = STAGES[stageKey] || stageKey
    }
    if (message !== undefined) {
      state.value.message = message
    }
  }

  const setStage = (stageKey: keyof typeof STAGES | string) => {
    state.value.stage = STAGES[stageKey as keyof typeof STAGES] || stageKey
  }

  const setMessage = (message: string) => {
    state.value.message = message
  }

  return {
    progress: readonly(state),
    show,
    hide,
    setProgress,
    setStage,
    setMessage,
    STAGES,
  }
}

// 全局单例导出，方便跨组件使用
export const globalLaunchProgress = useLaunchProgress()
