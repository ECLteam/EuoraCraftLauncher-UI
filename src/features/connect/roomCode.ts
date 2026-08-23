const ROOM_CODE_CHARSET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const ROOM_CODE_PATTERN = /^U\/[0-9A-HJ-NP-Z]{4}-[0-9A-HJ-NP-Z]{4}-[0-9A-HJ-NP-Z]{4}-[0-9A-HJ-NP-Z]{4}$/

export function validateRoomCode(code: string): boolean {
  if (!ROOM_CODE_PATTERN.test(code)) {
    return false
  }
  const chars = code.slice(2).replace(/-/g, '')
  let total = 0n
  let pow = 1n
  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i]
    if (ch === undefined) return false
    const value = ROOM_CODE_CHARSET.indexOf(ch)
    if (value < 0) {
      return false
    }
    total += BigInt(value) * pow
    pow *= 34n
  }
  return total % 7n === 0n
}
