import { computed, onScopeDispose, ref } from 'vue'
import type { UiSkin } from '@/features/themes/runtime/themeRuntime'

const activeSkin = ref<UiSkin>('classic')
let observer: MutationObserver | null = null
let consumers = 0

function readSkin(): UiSkin {
  return document.documentElement.dataset.uiSkin === 'folia' ? 'folia' : 'classic'
}

function ensureObserver(): void {
  if (observer || typeof document === 'undefined') return
  activeSkin.value = readSkin()
  observer = new MutationObserver(() => {
    activeSkin.value = readSkin()
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-ui-skin'] })
}

/** Reactive UI-skin state for the few components whose Folia markup differs. */
export function useUiSkin() {
  consumers += 1
  ensureObserver()
  onScopeDispose(() => {
    consumers -= 1
    if (consumers === 0) {
      observer?.disconnect()
      observer = null
    }
  })
  return {
    skin: computed(() => activeSkin.value),
    isFolia: computed(() => activeSkin.value === 'folia'),
  }
}
