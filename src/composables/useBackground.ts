import { ref } from 'vue'
import backend from '@/api/client'

const backgroundConfig = ref({
  type: 'default' as const,
  path: '',
  opacity: 0.8,
  blur: 0
})

export function useBackground() {
  const loadBackgroundConfig = async () => {
    const result = await backend.config.get('ui')
    if (result.success && result.data?.background) {
      backgroundConfig.value = { ...backgroundConfig.value, ...result.data.background }
    }
    return backgroundConfig.value
  }

  const updateBackground = async (type: string, path: string) => {
    const cfg = await backend.config.get('ui')
    const ui = cfg.data || {}
    const result = await backend.config.set('ui', {
      ...ui,
      background: { ...(ui.background || {}), type, path },
    })
    if (result.success) {
      backgroundConfig.value.type = type as any
      backgroundConfig.value.path = path
    }
    return result
  }

  const loadFromUrl = async (url: string) => {
    return backend.command('image_save_url', { url })
  }

  const selectLocal = async () => {
    return backend.command('select_image')
  }

  return {
    backgroundConfig,
    loadBackgroundConfig,
    updateBackground,
    loadFromUrl,
    selectLocal
  }
}
