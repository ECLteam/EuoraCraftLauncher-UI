export function formatRunDuration(totalSeconds: number): string {
  const normalized = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0
  const units = [
    { seconds: 86400, suffix: 'd' },
    { seconds: 3600, suffix: 'h' },
    { seconds: 60, suffix: 'm' },
    { seconds: 1, suffix: 's' },
  ]
  let remaining = normalized
  const parts: string[] = []

  for (const unit of units) {
    const value = Math.floor(remaining / unit.seconds)
    remaining %= unit.seconds
    if (value > 0 || (unit.seconds === 1 && parts.length === 0)) parts.push(`${value}${unit.suffix}`)
    if (parts.length === 2) break
  }

  return parts.join(' ')
}
