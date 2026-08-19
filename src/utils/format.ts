/**
 * 将日期值格式化为本地化字符串（zh-CN）。
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
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString('zh-CN', options)
}
