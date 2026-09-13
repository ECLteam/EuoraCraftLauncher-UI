import { describe, expect, it } from 'vitest'
import { titlebarVersionChannelLabel } from './titlebarVersionChannel'

describe('titlebarVersionChannelLabel', () => {
  it.each([
    ['alpha', 'ALPHA'],
    ['beta', 'BETA'],
    ['rc', 'RC'],
  ] as const)('显示 %s 预发布标签', (versionType, label) => {
    expect(titlebarVersionChannelLabel(versionType)).toBe(label)
  })

  it('正式版不显示预发布标签', () => {
    expect(titlebarVersionChannelLabel('release')).toBe('')
  })
})
