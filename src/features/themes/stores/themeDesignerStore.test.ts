import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { useTheme } from '@/composables/useTheme'
import type { ThemePresetV1 } from '@/types/api'
import { useThemeDesignerStore } from './themeDesignerStore'

function showcaseTheme(): ThemePresetV1 {
  return {
    schemaVersion: 1,
    id: 'showcase.theme',
    meta: { name: 'Showcase Theme', author: 'ECL' },
    schemes: {
      light: { canvas: '#f4f6fa', surface: 'rgba(255,255,255,.88)', text: '#1d2433' },
      dark: { canvas: '#171a21', surface: 'rgba(34,38,48,.88)', text: '#f1f3f7' },
      midnight: { canvas: '#101322', surface: 'rgba(24,28,48,.9)', text: '#dbe2ff', primary: '#8a97ff' },
    },
    schemeMeta: { midnight: { label: '午夜蓝', dark: true } },
    tokens: { primary: '#5b6ff5', radiusControl: '6px' },
    background: {},
    componentOverrides: {},
    nodeOverrides: {},
    instanceOverrides: {},
    effects: [],
    assets: {},
    pluginDependencies: [],
    extensions: {},
  }
}

describe('themeDesignerStore 主题观察器', () => {
  it('data-theme/data-scheme 变化时不会触发死循环', async () => {
    setActivePinia(createPinia())
    const theme = useTheme()
    const store = useThemeDesignerStore()

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query.includes('dark'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    })

    await theme.initTheme({
      theme: { mode: 'system', scheme: 'light', primary_color: '#6f8cff', appearance: {}, schedule: {} },
    })
    await store.initialize()
    store.activePreset = showcaseTheme()

    let mutations = 0
    const probe = new MutationObserver(() => {
      mutations += 1
    })
    probe.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-scheme'] })

    // 模拟外部(例如内联快照脚本或插件)改动主题属性
    document.documentElement.setAttribute('data-theme', 'light')
    document.documentElement.setAttribute('data-scheme', 'light')
    await new Promise((resolve) => setTimeout(resolve, 60))
    probe.disconnect()

    // jsdom 对 no-op setAttribute 也会派发 mutation，因此允许少量；死循环会达到成百上千次
    expect(mutations).toBeLessThan(20)
  })
})
