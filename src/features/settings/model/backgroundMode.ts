export type BackgroundMode = 'single' | 'carousel' | 'random'

export const BACKGROUND_MODE_VALUES: BackgroundMode[] = ['single', 'carousel', 'random']

export const BACKGROUND_INTERVAL_MIN = 5
export const BACKGROUND_INTERVAL_MAX = 60
export const BACKGROUND_INTERVAL_DEFAULT = 10

export function isCarouselMode(mode: BackgroundMode | undefined): mode is 'carousel' | 'random' {
  return mode === 'carousel' || mode === 'random'
}

export function clampBackgroundInterval(value: number): number {
  if (!Number.isFinite(value)) return BACKGROUND_INTERVAL_DEFAULT
  return Math.min(BACKGROUND_INTERVAL_MAX, Math.max(BACKGROUND_INTERVAL_MIN, Math.round(value)))
}

/**
 * 计算下一张背景图索引。
 * - carousel：顺序 +1
 * - random：随机，且避免与当前相同（单张时固定返回 0）
 */
export function nextBackgroundIndex(mode: BackgroundMode, length: number, current: number): number {
  if (length <= 1) return 0
  if (mode === 'random') {
    let next = current
    while (next === current) {
      next = Math.floor(Math.random() * length)
    }
    return next
  }
  return (current + 1) % length
}
