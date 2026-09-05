import { getCurrentLocale } from '@/i18n'

/**
 * 将日期值格式化为本地化字符串（跟随当前界面语言）。
 *
 * 空值或无效日期统一返回 fallback，避免各处重复「判空 + NaN 检查 + toLocaleDateString」样板。
 *
 * @param value - 日期字符串 / 时间戳 / Date 对象
 * @param options - Intl.DateTimeFormatOptions，默认年月日
 * @param fallback - 空值或无效日期时的回退文本，默认 '-'
 */
export function formatDate(
  value?: string | number | Date | null,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' },
  fallback = '-'
): string {
  if (!value) return fallback
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString(getCurrentLocale(), options)
}

/** 将字节数格式化为可读大小（B/KB/MB/GB）。无效或负数返回 fallback。 */
export function formatFileSize(bytes: number, fallback = '-'): string {
  if (!Number.isFinite(bytes) || bytes < 0) return fallback
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unit]}`
}

/** 将 Unix 秒时间戳格式化为月/日 时:分；无效值返回 fallback。 */
export function formatTimestamp(seconds?: number, fallback = '-'): string {
  if (!seconds) return fallback
  const date = new Date(seconds * 1000)
  return Number.isNaN(date.getTime())
    ? fallback
    : date.toLocaleString(getCurrentLocale(), { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
