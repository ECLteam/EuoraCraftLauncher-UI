import { ref, onMounted, onUnmounted } from 'vue'
import backend from '@/api/client'

const mouseEffectEnabled = ref(false)
const mouseEffectColor = ref('45,175,255')
const mouseEffectScale = ref(1.5)
const mouseEffectOpacity = ref(1.0)
const mouseEffectSpeed = ref(1.0)

const applyMouseEffectConfig = (config: any) => {
  mouseEffectEnabled.value = config.enabled ?? false
  mouseEffectColor.value = config.color ?? '45,175,255'
  mouseEffectScale.value = config.scale ?? 1.5
  mouseEffectOpacity.value = config.opacity ?? 1.0
  mouseEffectSpeed.value = config.speed ?? 1.0
}

const loadMouseEffectConfig = async () => {
  try {
    const result = await backend.config.get('ui')
    if (result.success && result.data?.mouse_effect) {
      applyMouseEffectConfig(result.data.mouse_effect)
    }
  } catch (e) {
    console.error('加载鼠标效果配置失败:', e)
  }
}

const setupMouseEffectListeners = () => {
  const handleChange = async (event: any) => {
    mouseEffectEnabled.value = event.detail.enabled
    await loadMouseEffectConfig()
  }
  const handleUpdate = async () => {
    await loadMouseEffectConfig()
  }
  window.addEventListener('mouseEffectChange', handleChange)
  window.addEventListener('mouseEffectUpdate', handleUpdate)

  return () => {
    window.removeEventListener('mouseEffectChange', handleChange)
    window.removeEventListener('mouseEffectUpdate', handleUpdate)
  }
}

export function useMouseEffect() {
  let cleanup: (() => void) | null = null

  const init = () => {
    cleanup = setupMouseEffectListeners()
    loadMouseEffectConfig()
  }

  const dispose = () => {
    cleanup?.()
    cleanup = null
  }

  return {
    enabled: mouseEffectEnabled,
    color: mouseEffectColor,
    scale: mouseEffectScale,
    opacity: mouseEffectOpacity,
    speed: mouseEffectSpeed,
    applyConfig: applyMouseEffectConfig,
    loadConfig: loadMouseEffectConfig,
    init,
    dispose,
  }
}
