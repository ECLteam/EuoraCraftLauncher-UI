import { beforeEach, describe, expect, it } from 'vitest'
import {
  launcherLogLayout,
  launcherLogUnread,
  launcherLogWindowEnabled,
  launcherLogWindowMode,
  minimizeLauncherLogWindow,
  maximizeLauncherLogWindow,
  openLauncherLogWindow,
  restoreLauncherLogWindow,
  setLauncherLogWindowEnabled,
  useLauncherLogWindow,
} from './useLauncherLogWindow'

describe('useLauncherLogWindow 启动器日志悬浮窗状态', () => {
  beforeEach(() => {
    launcherLogWindowEnabled.value = false
    launcherLogWindowMode.value = 'minimized'
    launcherLogUnread.value = 0
    Object.assign(launcherLogLayout, { x: 72, y: 72, width: 660, height: 420, bx: 24, by: 24 })
  })

  it('setLauncherLogWindowEnabled 开启后回到最小化并清零未读，关闭则隐藏', () => {
    useLauncherLogWindow()
    setLauncherLogWindowEnabled(true)
    expect(launcherLogWindowEnabled.value).toBe(true)
    expect(launcherLogWindowMode.value).toBe('minimized')
    setLauncherLogWindowEnabled(false)
    expect(launcherLogWindowEnabled.value).toBe(false)
  })

  it('重新开启悬浮窗会重置形态与未读数', () => {
    setLauncherLogWindowEnabled(true)
    openLauncherLogWindow()
    launcherLogUnread.value = 5
    setLauncherLogWindowEnabled(false)
    setLauncherLogWindowEnabled(true)
    expect(launcherLogWindowMode.value).toBe('minimized')
    expect(launcherLogUnread.value).toBe(0)
  })

  it('openLauncherLogWindow 展开为窗口并清零未读', () => {
    setLauncherLogWindowEnabled(true)
    launcherLogUnread.value = 3
    openLauncherLogWindow()
    expect(launcherLogWindowMode.value).toBe('floating')
    expect(launcherLogUnread.value).toBe(0)
  })

  it('minimizeLauncherLogWindow 收起为圆形按钮并清零未读', () => {
    setLauncherLogWindowEnabled(true)
    openLauncherLogWindow()
    launcherLogUnread.value = 2
    minimizeLauncherLogWindow()
    expect(launcherLogWindowMode.value).toBe('minimized')
    expect(launcherLogUnread.value).toBe(0)
  })

  it('maximizeLauncherLogWindow 与 restoreLauncherLogWindow 在全屏与窗口间切换', () => {
    setLauncherLogWindowEnabled(true)
    maximizeLauncherLogWindow()
    expect(launcherLogWindowMode.value).toBe('maximized')
    restoreLauncherLogWindow()
    expect(launcherLogWindowMode.value).toBe('floating')
  })
})
