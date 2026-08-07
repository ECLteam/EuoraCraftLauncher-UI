import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LAUNCH_MIN_PROGRESS_DURATION } from '@/config/game'
import { globalLaunchProgress } from './useLaunchProgress'

describe('useLaunchProgress', () => {
  let frameCallback: FrameRequestCallback | undefined
  let frameId = 0
  let now = 0

  beforeEach(() => {
    now = 0
    frameId = 0
    frameCallback = undefined
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frameCallback = callback
      return ++frameId
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => {
    globalLaunchProgress.hide()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const runFor = (duration: number, frameDuration = 50) => {
    const end = now + duration
    while (now < end && frameCallback) {
      now = Math.min(end, now + frameDuration)
      const callback = frameCallback
      frameCallback = undefined
      callback(now)
    }
  }

  it('按固定速度前进，在耗时阶段上限处等待并以相同速度恢复', () => {
    globalLaunchProgress.show()
    globalLaunchProgress.setProgress(25, 'checking_files', '正在检查游戏文件')

    runFor(1000)
    const firstSecond = globalLaunchProgress.smoothPercent.value
    runFor(1000)
    const secondSecond = globalLaunchProgress.smoothPercent.value

    expect(firstSecond).toBeCloseTo(20, 5)
    expect(secondSecond - firstSecond).toBeCloseTo(20, 5)

    runFor(1000)
    expect(globalLaunchProgress.smoothPercent.value).toBe(54)
    runFor(1000)
    expect(globalLaunchProgress.smoothPercent.value).toBe(54)

    globalLaunchProgress.setProgress(72, 'building_params', '正在生成启动参数')
    runFor(500)
    expect(globalLaunchProgress.smoothPercent.value).toBeCloseTo(64, 5)
  })

  it('启动过快时仍走满最短时长，并在完成前拒绝隐藏', () => {
    globalLaunchProgress.show()
    globalLaunchProgress.setProgress(100, 'success', '启动成功')
    globalLaunchProgress.hide()

    runFor(LAUNCH_MIN_PROGRESS_DURATION - 100)
    expect(globalLaunchProgress.smoothPercent.value).toBeCloseTo(98, 5)
    expect(globalLaunchProgress.progress.value.visible).toBe(true)

    runFor(100)
    expect(globalLaunchProgress.smoothPercent.value).toBe(100)
    expect(globalLaunchProgress.progress.value.visible).toBe(false)
  })

  it('后端阶段进度倒退时显示进度不会回退', () => {
    globalLaunchProgress.show()
    globalLaunchProgress.setProgress(72, 'building_params', '正在生成启动参数')
    runFor(2500)
    const current = globalLaunchProgress.smoothPercent.value

    globalLaunchProgress.setProgress(17, 'account_ready', '登录凭据已就绪')
    expect(globalLaunchProgress.smoothPercent.value).toBe(current)
  })
})
