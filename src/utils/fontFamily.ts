import { FONT_FAMILY_OPTIONS } from '@/config/theme'

const unsafeFontName = /["'\\,;{}()]/u

/** 只接受一个本机字体族名称，避免把输入当作任意 CSS 字体栈。 */
export function normalizeSystemFontName(value: string): string | null {
  const hasControlCharacter = [...value].some((character) => {
    const code = character.charCodeAt(0)
    return code < 32 || code === 127
  })
  const name = value.trim().replace(/\s+/gu, ' ')
  return name.length > 0 && name.length <= 80 && !unsafeFontName.test(name) && !hasControlCharacter ? name : null
}

/** 旧配置可能保存了完整 CSS 字体栈；预设和旧值都按原样应用。 */
export function resolveFontFamily(value: string, fallback: string): string {
  if (!value) return fallback
  if (FONT_FAMILY_OPTIONS.some((option) => option.value === value)) return value
  const customName = normalizeSystemFontName(value)
  return customName ? `"${customName}", ${fallback}` : value
}
