import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { useTheme } from '@/composables/useTheme'

describe('useTheme 语义色', () => {
  it('themeOverrides 将 --ecl-color-* 解析为具体色值而非 var()', () => {
    setActivePinia(createPinia())
    const theme = useTheme()

    theme.setAppearance({ warning_color: '#ff8800', info_color: '#3366cc' }, false)

    const overrides = theme.themeOverrides.value
    expect(overrides.common).toBeDefined()
    expect(overrides.common!.warningColor).toBe('#ff8800')
    expect(overrides.common!.infoColor).toBe('#3366cc')
    for (const color of [
      overrides.common!.successColor,
      overrides.common!.warningColor,
      overrides.common!.errorColor,
      overrides.common!.infoColor,
    ]) {
      expect(color).toBeTypeOf('string')
      expect(color).not.toContain('var(')
    }
  })

  it('未配置语义色时回退到主题默认色', () => {
    setActivePinia(createPinia())
    const theme = useTheme()

    theme.setAppearance({}, false)
    const overrides = theme.themeOverrides.value
    expect(overrides.common).toBeDefined()
    expect(overrides.common!.warningColor).toBeTruthy()
    expect(overrides.common!.warningColor).not.toContain('var(')
  })
})
