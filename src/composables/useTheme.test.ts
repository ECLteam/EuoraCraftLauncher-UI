import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { useTheme } from '@/composables/useTheme'
import { LIGHT_THEME_COLORS } from '@/config/theme'

describe('useTheme 语义色', () => {
  it('配置外观后语义色仍回退到主题默认色而非自定义值', () => {
    setActivePinia(createPinia())
    const theme = useTheme()

    // 旧版支持自定义语义色（warning_color/info_color），已随主题重构移除；
    // 语义色现在统一回退到主题默认色
    theme.setAppearance({ radius_control: 4 }, false)

    const overrides = theme.themeOverrides.value
    expect(overrides.common).toBeDefined()
    expect(overrides.common!.warningColor).toBe(LIGHT_THEME_COLORS.warning)
    expect(overrides.common!.infoColor).toBe(LIGHT_THEME_COLORS.info)
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

  it('未配置外观时语义色回退到主题默认色', () => {
    setActivePinia(createPinia())
    const theme = useTheme()

    theme.setAppearance({}, false)
    const overrides = theme.themeOverrides.value
    expect(overrides.common).toBeDefined()
    expect(overrides.common!.successColor).toBe(LIGHT_THEME_COLORS.success)
    expect(overrides.common!.warningColor).toBe(LIGHT_THEME_COLORS.warning)
    expect(overrides.common!.errorColor).toBe(LIGHT_THEME_COLORS.error)
    expect(overrides.common!.infoColor).toBe(LIGHT_THEME_COLORS.info)
    expect(overrides.common!.warningColor).not.toContain('var(')
  })
})
