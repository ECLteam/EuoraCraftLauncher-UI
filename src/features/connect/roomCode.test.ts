import { describe, expect, it } from 'vitest'
import { validateRoomCode } from './roomCode'

describe('validateRoomCode', () => {
  it('accepts a valid generated code', () => {
    expect(validateRoomCode('U/RL6B-Z9Y6-Z8RU-5LF2')).toBe(true)
  })

  it('rejects pasted log/arbitrary long text', () => {
    expect(validateRoomCode('2026-08-22 22:07:48 ERROR 无法找到联机大厅')).toBe(false)
    expect(validateRoomCode('U/ECL7-W9KM-4R2P-X8QA 额外文本')).toBe(false)
  })

  it('rejects malformed codes', () => {
    expect(validateRoomCode('')).toBe(false)
    expect(validateRoomCode('RL6B-Z9Y6-Z8RU-5LF2')).toBe(false)
    expect(validateRoomCode('U/RL6BZ9Y6Z8RU5LF2')).toBe(false)
    expect(validateRoomCode('U/RL6B-Z9Y6-Z8RU-5LF')).toBe(false)
    expect(validateRoomCode('U/RL6B-Z9Y6-Z8RU-5LF2-EXTRA')).toBe(false)
  })

  it('rejects characters outside the Scaffolding charset (I/O/Q excluded)', () => {
    expect(validateRoomCode('U/RL6B-Z9Y6-Z8RU-5LI2')).toBe(false)
    expect(validateRoomCode('U/RL6B-Z9Y6-Z8RU-5LO2')).toBe(false)
    expect(validateRoomCode('U/RL6B-Z9Y6-Z8RU-5LQ2')).toBe(false)
  })

  it('rejects codes whose little-endian base34 sum is not divisible by 7', () => {
    expect(validateRoomCode('U/AAAA-AAAA-AAAA-AAA0')).toBe(false)
    expect(validateRoomCode('U/AAAA-AAAA-AAAA-AAA1')).toBe(false)
  })
})
