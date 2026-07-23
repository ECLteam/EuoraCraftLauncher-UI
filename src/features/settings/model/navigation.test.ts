import { describe, expect, it } from 'vitest'
import { resolveNavigationMode } from './navigation'

describe('resolveNavigationMode', () => {
  it('优先使用显式导航模式', () => {
    expect(resolveNavigationMode({ navigation_mode: 'top', titlebar_hidden: true })).toBe('top')
  })

  it('兼容旧版 titlebar_hidden 配置', () => {
    expect(resolveNavigationMode({ titlebar_hidden: true })).toBe('sidebar')
    expect(resolveNavigationMode({ titlebar_hidden: false })).toBe('top')
  })

  it('缺少配置时保持侧边栏', () => {
    expect(resolveNavigationMode()).toBe('sidebar')
  })
})
