import { describe, expect, it } from 'vitest'
import {
  BACKGROUND_INTERVAL_DEFAULT,
  BACKGROUND_INTERVAL_MAX,
  BACKGROUND_INTERVAL_MIN,
  clampBackgroundInterval,
  isCarouselMode,
  nextBackgroundIndex,
} from './backgroundMode'

describe('backgroundMode 轮播模式判定', () => {
  it('carousel/random 属于轮播类，single 不属于', () => {
    expect(isCarouselMode('carousel')).toBe(true)
    expect(isCarouselMode('random')).toBe(true)
    expect(isCarouselMode('single')).toBe(false)
    expect(isCarouselMode(undefined)).toBe(false)
  })
})

describe('clampBackgroundInterval 间隔边界', () => {
  it('超出范围时收敛到 [5, 60]', () => {
    expect(clampBackgroundInterval(3)).toBe(BACKGROUND_INTERVAL_MIN)
    expect(clampBackgroundInterval(120)).toBe(BACKGROUND_INTERVAL_MAX)
    expect(clampBackgroundInterval(15)).toBe(15)
  })

  it('小数四舍五入', () => {
    expect(clampBackgroundInterval(12.4)).toBe(12)
    expect(clampBackgroundInterval(12.6)).toBe(13)
  })

  it('非法输入回退默认值', () => {
    expect(clampBackgroundInterval(Number.NaN)).toBe(BACKGROUND_INTERVAL_DEFAULT)
    expect(clampBackgroundInterval(Number.POSITIVE_INFINITY)).toBe(BACKGROUND_INTERVAL_DEFAULT)
  })
})

describe('nextBackgroundIndex 下一张索引', () => {
  it('carousel 顺序递增并回绕', () => {
    expect(nextBackgroundIndex('carousel', 3, 0)).toBe(1)
    expect(nextBackgroundIndex('carousel', 3, 1)).toBe(2)
    expect(nextBackgroundIndex('carousel', 3, 2)).toBe(0)
  })

  it('random 不返回当前索引', () => {
    for (let i = 0; i < 50; i++) {
      const next = nextBackgroundIndex('random', 5, 2)
      expect(next).not.toBe(2)
      expect(next).toBeGreaterThanOrEqual(0)
      expect(next).toBeLessThan(5)
    }
  })

  it('random 在仅一张图时固定返回 0', () => {
    expect(nextBackgroundIndex('random', 1, 0)).toBe(0)
  })

  it('空列表时返回 0', () => {
    expect(nextBackgroundIndex('carousel', 0, 0)).toBe(0)
    expect(nextBackgroundIndex('random', 0, 0)).toBe(0)
  })
})
