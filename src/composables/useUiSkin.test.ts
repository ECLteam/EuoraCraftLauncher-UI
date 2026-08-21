import { describe, expect, it } from 'vitest'
import { effectScope } from 'vue'
import { useUiSkin } from './useUiSkin'

describe('useUiSkin', () => {
  it('reacts to the theme runtime skin attribute', async () => {
    document.documentElement.dataset.uiSkin = 'classic'
    const scope = effectScope()
    const state = scope.run(() => useUiSkin())!

    expect(state.isFolia.value).toBe(false)
    document.documentElement.dataset.uiSkin = 'folia'
    await Promise.resolve()
    expect(state.skin.value).toBe('folia')
    expect(state.isFolia.value).toBe(true)

    scope.stop()
    document.documentElement.dataset.uiSkin = 'classic'
  })
})
