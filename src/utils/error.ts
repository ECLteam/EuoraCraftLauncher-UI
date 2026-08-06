export function getErrorMessage(error: unknown, fallback = '未知错误'): string {
  if (typeof error === 'string') return error.trim() || fallback
  if (error instanceof Error) return error.message.trim() || fallback
  if (!error || typeof error !== 'object') return fallback

  const values = error as Record<string, unknown>
  for (const key of ['message', 'detail', 'error', 'reason']) {
    const value = values[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (value instanceof Error && value.message.trim()) return value.message.trim()
  }
  return fallback
}
