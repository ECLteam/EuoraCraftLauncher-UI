import { describe, expect, it } from 'vitest'
import { DEFAULT_PRIMARY_COLOR, PRESET_COLORS } from './theme'

describe('theme defaults', () => {
  it('默认主色属于外观设置的预设列表', () => {
    expect(PRESET_COLORS.map((color) => color.value)).toContain(DEFAULT_PRIMARY_COLOR)
  })
})
