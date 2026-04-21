import { ref, watch } from 'vue'
import { api } from '@/api/client'

const backgroundConfig = ref({
  type: 'default' as const,
  path: '',
  opacity: 0.8,
  blur: 0
})

export function useBackground() {
  const loadBackgroundConfig = async () => {
    const result = await api.getBackgroundConfig()
    if (result.success && result.data) {
      backgroundConfig.value = { ...backgroundConfig.value, ...result.data }
    }
    return backgroundConfig.value
  }

  const updateBackground = async (type: string, path: string) => {
    const result = await api.updateBackgroundImage(type, path)
    if (result.success) {
      backgroundConfig.value.type = type as any
      backgroundConfig.value.path = path
    }
    return result
  }

  const loadFromUrl = async (url: string) => {
    return api.loadImageFromUrl(url)
  }

  const selectLocal = async () => {
    return api.selectLocalImage()
  }

  return {
    backgroundConfig,
    loadBackgroundConfig,
    updateBackground,
    loadFromUrl,
    selectLocal
  }
}
