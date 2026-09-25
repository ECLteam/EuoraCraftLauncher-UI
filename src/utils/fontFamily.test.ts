import { describe, expect, it } from 'vitest'
import { normalizeSystemFontName, resolveFontFamily } from '@/utils/fontFamily'

describe('字体名称与旧配置', () => {
  it('将本机字体名称标准化并安全放入字体栈', () => {
    expect(normalizeSystemFontName('  Microsoft   YaHei  ')).toBe('Microsoft YaHei')
    expect(resolveFontFamily('Microsoft YaHei', 'var(--font-body)')).toBe('"Microsoft YaHei", var(--font-body)')
    expect(normalizeSystemFontName('Bad"Font')).toBeNull()
    expect(normalizeSystemFontName('Bad\nFont')).toBeNull()
    expect(normalizeSystemFontName('x'.repeat(81))).toBeNull()
  })

  it('保留旧版预设与自定义 CSS 字体栈', () => {
    expect(resolveFontFamily('"Microsoft YaHei", system-ui, sans-serif', 'var(--font-body)')).toBe(
      '"Microsoft YaHei", system-ui, sans-serif'
    )
    expect(resolveFontFamily('Legacy Font, sans-serif', 'var(--font-body)')).toBe('Legacy Font, sans-serif')
  })
})
