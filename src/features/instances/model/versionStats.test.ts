import { describe, expect, it } from 'vitest'
import { formatRunDuration } from './versionStats'

describe('formatRunDuration', () => {
  it('formats seconds into at most two readable units', () => {
    expect(formatRunDuration(0)).toBe('0s')
    expect(formatRunDuration(65)).toBe('1m 5s')
    expect(formatRunDuration(90061)).toBe('1d 1h')
  })

  it('normalizes invalid and negative values', () => {
    expect(formatRunDuration(-5)).toBe('0s')
    expect(formatRunDuration(Number.NaN)).toBe('0s')
  })
})
