import { describe, expect, it } from 'vitest'
import type { ThemeDesignSessionSnapshot, ThemePresetV1 } from '@/types/api'
import {
  applyThemePreset,
  clearThemePreview,
  compileThemeCss,
  resolveSchemeDark,
  resolveThemeProperty,
  resolveUiSkin,
  themeInstanceKey,
} from './themeRuntime'

function preset(): ThemePresetV1 {
  return {
    schemaVersion: 1,
    id: 'user.test',
    meta: { name: 'Test' },
    schemes: { light: { canvas: '#fff' }, dark: { canvas: '#111' } },
    tokens: { primary: '#123456', radiusCard: '12px' },
    background: {},
    componentOverrides: { card: { properties: { backgroundColor: '#111' } } },
    nodeOverrides: { hero: { properties: { backgroundColor: '#222', pointerEvents: 'none' } } },
    instanceOverrides: { abc: { properties: { backgroundColor: '#333' } } },
    effects: [],
    assets: {},
    pluginDependencies: [],
    extensions: {},
  }
}

describe('theme runtime', () => {
  it('compiles controlled variables and ignores dangerous style properties', () => {
    const css = compileThemeCss(preset(), 'light')
    expect(css).toContain('--primary:#123456')
    expect(css).toContain('[data-theme-node="hero"]')
    expect(css).not.toContain('pointer-events')
  })

  it('resolves component, node, instance and draft sources in order', () => {
    const base = preset()
    const draft = structuredClone(base)
    draft.instanceOverrides!.abc!.properties!.backgroundColor = '#444'
    const snapshot = {
      sessionId: 's',
      presetId: 'user.test',
      basePreset: base,
      draft,
      revision: 1,
      dirty: true,
      canUndo: true,
      canRedo: false,
      selection: null,
    } satisfies ThemeDesignSessionSnapshot
    expect(
      resolveThemeProperty(
        snapshot,
        {
          nodeId: 'hero',
          componentType: 'card',
          instanceKey: 'abc',
          scope: 'instance',
        },
        'backgroundColor'
      )
    ).toEqual({ value: '#444', source: 'draft' })
  })

  it('compiles scoped effect recipes and generates private stable instance keys', () => {
    const theme = preset()
    theme.effects = [
      {
        id: 'effect-1',
        type: 'glass',
        target: { scope: 'node', id: 'hero' },
        params: { blur: '16px' },
      },
      {
        id: 'effect-2',
        type: 'motion',
        target: { scope: 'instance', id: 'abc' },
        params: { transform: 'translateY(-3px)' },
      },
    ]
    const css = compileThemeCss(theme, 'dark')
    expect(css).toContain('backdrop-filter:blur(16px) saturate(1.2)')
    expect(css).toContain('[data-theme-instance="abc"]:hover{transform:translateY(-3px)}')
    expect(themeInstanceKey('minecraft', 'D:/Games/private-name')).toBe(
      themeInstanceKey('minecraft', 'D:/Games/private-name')
    )
    expect(themeInstanceKey('minecraft', 'D:/Games/private-name')).not.toContain('private-name')
  })

  it('compiles custom schemes with dark base fallback and scheme-level primary', () => {
    const theme = preset()
    theme.schemeMeta = { midnight: { label: '午夜蓝', dark: true } }
    theme.schemes.dark!.surface = 'rgba(34,38,48,0.88)'
    theme.schemes.midnight = { canvas: '#0b0e1a', primary: '#8a97ff' }
    const css = compileThemeCss(theme, 'midnight')
    expect(css).toContain('--ecl-canvas:#0b0e1a')
    expect(css).toContain('--ecl-primary:#8a97ff')
    // 缺少的 surface 回退到 dark 基色
    expect(css).toContain('--ecl-surface:rgba(34,38,48,0.88)')
    // token 级 primary 被 scheme 级覆盖
    expect(css).not.toContain('--primary:#123456')
    expect(css).toContain('--primary:#8a97ff')
  })

  it('resolves scheme dark nature from declaration and luminance fallback', () => {
    const theme = preset()
    theme.schemeMeta = { midnight: { label: '午夜蓝', dark: true } }
    theme.schemes.sepia = { canvas: '#f0e6d2' }
    theme.schemes.midnight = { canvas: '#0b0e1a' }
    expect(resolveSchemeDark(theme, 'midnight')).toBe(true)
    expect(resolveSchemeDark(theme, 'dark')).toBe(true)
    expect(resolveSchemeDark(theme, 'light')).toBe(false)
    expect(resolveSchemeDark(theme, 'sepia')).toBe(false)
  })

  it('falls back to light scheme for unknown or empty scheme names', () => {
    const css = compileThemeCss(preset(), 'missing-scheme')
    expect(css).toContain('--ecl-canvas:#fff')
  })

  it('applies Folia only for the explicit trusted skin and restores classic', () => {
    const folia = preset()
    folia.uiSkin = 'folia'
    expect(resolveUiSkin(folia)).toBe('folia')
    expect(resolveUiSkin(preset())).toBe('classic')
    expect(resolveUiSkin({ uiSkin: 'unknown' } as never)).toBe('classic')

    applyThemePreset(folia)
    expect(document.documentElement.dataset.uiSkin).toBe('folia')
    clearThemePreview()
    expect(document.documentElement.dataset.uiSkin).toBe('classic')
  })
})
