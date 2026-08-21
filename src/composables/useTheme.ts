import {
  argbFromHex,
  hexFromArgb,
  sourceColorFromImage,
  themeFromSourceColor,
} from '@material/material-color-utilities'
import { darkTheme, type GlobalTheme, type GlobalThemeOverrides } from 'naive-ui'
import { defineStore, storeToRefs } from 'pinia'
import { computed, readonly, ref } from 'vue'
import { pinia } from '@/app/stores'
import { PRESET_COLORS, DEFAULT_PRIMARY_COLOR, LIGHT_THEME_COLORS, DARK_THEME_COLORS } from '@/config/theme'
import { resolveLocalImageUrl, settingsApi } from '@/features/settings/api/settingsApi'
import { resolveNavigationMode } from '@/features/settings/model/navigation'
import type { BackgroundConfig, NavigationMode, ThemeConfig } from '@/types/api'

interface ThemeInitPayload {
  theme?: Partial<ThemeConfig> & { background_opacity?: number }
  background?: Partial<BackgroundConfig>
}

/** 从背景图提取主题色的模式 */
export type DeriveMode = 'off' | 'default' | 'monet'

/** 玻璃质感效果开关的本地存储键（仅前端记忆，不同步后端） */
export const GLASS_EFFECT_STORAGE_KEY = 'euoracraft-glass-effect'

/** 流体（极光）背景开关的本地存储键（仅前端记忆，不同步后端） */
export const AURORA_STORAGE_KEY = 'euoracraft-aurora'

/** 从背景图提取主题色开关的本地存储键（仅前端记忆，不同步后端） */
export const DERIVE_THEME_COLOR_STORAGE_KEY = 'euoracraft-derive-theme-color'

/** 背景取色模式（off/default/monet）的本地存储键（仅前端记忆，不同步后端） */
export const DERIVE_MODE_STORAGE_KEY = 'euoracraft-derive-mode'

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function normalizeHex(hex: string): string {
  hex = hex.replace(/^#/, '')
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('')
  }
  return `#${hex}`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  hex = normalizeHex(hex)
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) throw new Error('Invalid hex color')

  return {
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16),
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function mix(color1: string, color2: string, weight: number = 0.5): string {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  const w = clamp(weight, 0, 1)
  const r = Math.round(rgb1.r * (1 - w) + rgb2.r * w)
  const g = Math.round(rgb1.g * (1 - w) + rgb2.g * w)
  const b = Math.round(rgb1.b * (1 - w) + rgb2.b * w)

  return rgbToHex(r, g, b)
}

function rgba(color: string, alpha: number): string {
  const rgb = hexToRgb(color)
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h /= 6
  }
  return [h * 360, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360
  let r = 0
  let g = 0
  let b = 0
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

function shiftHue(hex: string, degrees: number): string {
  const rgb = hexToRgb(hex)
  const [h, s, l] = rgbToHsl(rgb.r, rgb.g, rgb.b)
  const [r, g, b] = hslToRgb((h + degrees + 360) % 360, s, l)
  return rgbToHex(r, g, b)
}

/**
 * 色相偏移 + 降饱和 + 目标亮度（用于深色模式极光辅色，避免亮色刺眼）。
 */
function shiftHueSlim(hex: string, degrees: number, satScale: number, targetLightness: number): string {
  const rgb = hexToRgb(hex)
  const [h, s] = rgbToHsl(rgb.r, rgb.g, rgb.b)
  const [r, g, b] = hslToRgb((h + degrees + 360) % 360, Math.min(1, s * satScale), targetLightness)
  return rgbToHex(r, g, b)
}

/**
 * 保留色相，降饱和并压暗到目标亮度（深色模式极光主色）。
 */
function dimForDark(hex: string, satScale: number, targetLightness: number): string {
  const rgb = hexToRgb(hex)
  const [h, s] = rgbToHsl(rgb.r, rgb.g, rgb.b)
  const [r, g, b] = hslToRgb(h, Math.min(1, s * satScale), targetLightness)
  return rgbToHex(r, g, b)
}

/**
 * 由主色派生极光渐变光斑配色（主色 + 色相偏移的两个辅色），明暗模式不同强度。
 * 深色模式采用"低调淡光"：低透明度、降饱和、压暗亮度。
 */
function createAuroraColors(baseColor: string, isDark: boolean): { c1: string; c2: string; c3: string } {
  const color = /^#([a-f\d]{6})$/i.test(normalizeHex(baseColor)) ? normalizeHex(baseColor) : DEFAULT_PRIMARY_COLOR
  if (isDark) {
    return {
      c1: rgba(dimForDark(color, 0.9, 0.32), 0.3),
      c2: rgba(shiftHueSlim(color, 45, 0.6, 0.34), 0.24),
      c3: rgba(shiftHueSlim(color, -35, 0.55, 0.3), 0.18),
    }
  }
  return {
    c1: rgba(color, 0.12),
    c2: rgba(shiftHue(color, 45), 0.1),
    c3: rgba(shiftHue(color, -35), 0.085),
  }
}

/**
 * 从图片 URL 提取主色：canvas 缩略图 + HSL 色相聚类。
 * 跳过近灰/极暗/极亮像素，取像素数最多的色相桶平均色；失败返回 null（功能降级）。
 */
function extractPrimaryFromImage(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      try {
        const size = 48
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = Math.max(1, Math.round((size * image.naturalHeight) / Math.max(1, image.naturalWidth)))
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (!context) {
          resolve(null)
          return
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
        const buckets = new Map<number, { r: number; g: number; b: number; n: number }>()
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]!
          const g = data[i + 1]!
          const b = data[i + 2]!
          const a = data[i + 3]!
          if (a < 128) continue
          const [h, s, l] = rgbToHsl(r, g, b)
          if (s < 0.15 || l < 0.12 || l > 0.88) continue
          const hueBucket = Math.floor(h / 30)
          const bucket = buckets.get(hueBucket) ?? { r: 0, g: 0, b: 0, n: 0 }
          bucket.r += r
          bucket.g += g
          bucket.b += b
          bucket.n += 1
          buckets.set(hueBucket, bucket)
        }
        let best: { r: number; g: number; b: number; n: number } | null = null
        for (const bucket of buckets.values()) {
          if (!best || bucket.n > best.n) best = bucket
        }
        if (!best || best.n < 2) {
          resolve(null)
          return
        }
        resolve(rgbToHex(Math.round(best.r / best.n), Math.round(best.g / best.n), Math.round(best.b / best.n)))
      } catch {
        resolve(null)
      }
    }
    image.onerror = () => resolve(null)
    image.src = url
  })
}

/**
 * 从图片 URL 提取 Monet 种子色（Material You，基于 HCT 色彩空间）。
 */
function monetSeedFromImage(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = async () => {
      try {
        const argb = await sourceColorFromImage(image)
        resolve(hexFromArgb(argb))
      } catch {
        resolve(null)
      }
    }
    image.onerror = () => resolve(null)
    image.src = url
  })
}

let monetPaletteCache: { seed: string; palette: { tone(tone: number): number } } | null = null

function monetTone(seedHex: string, tone: number): string {
  if (!monetPaletteCache || monetPaletteCache.seed !== seedHex) {
    const theme = themeFromSourceColor(argbFromHex(seedHex))
    monetPaletteCache = { seed: seedHex, palette: theme.palettes.primary }
  }
  return hexFromArgb(monetPaletteCache.palette.tone(tone))
}

/**
 * 根据 Monet 种子色生成完整 Material You tonal 色阶（明暗各用 tone 40/80、30/90、20/95）。
 */
function createMonetScale(
  seedHex: string,
  isDark: boolean
): {
  primary: string
  primaryHover: string
  primaryPressed: string
  primaryLight: string
  primaryRgb: string
} {
  const primary = monetTone(seedHex, isDark ? 80 : 40)
  const rgb = hexToRgb(primary)
  return {
    primary,
    primaryHover: monetTone(seedHex, isDark ? 90 : 30),
    primaryPressed: monetTone(seedHex, isDark ? 95 : 20),
    primaryLight: rgba(primary, 0.15),
    primaryRgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
  }
}

/**
 * 根据基础色生成主题主色阶。
 * @param baseColor - 十六进制基础色
 * @param isDark - 是否为深色模式（决定悬停/按下色的混色方向）
 * @returns 包含主色、悬停色、按下色、浅色及 RGB 值的色阶对象
 */
function createPrimaryScale(
  baseColor: string,
  isDark: boolean
): {
  primary: string
  primaryHover: string
  primaryPressed: string
  primaryLight: string
  primaryRgb: string
} {
  const normalized = normalizeHex(baseColor)
  const isValid = /^#([a-f\d]{6})$/i.test(normalized)
  const color = isValid ? normalized : DEFAULT_PRIMARY_COLOR
  const rgb = hexToRgb(color)

  return {
    primary: color,
    primaryHover: mix(color, isDark ? '#ffffff' : '#000000', 0.15),
    primaryPressed: mix(color, isDark ? '#ffffff' : '#000000', 0.3),
    primaryLight: rgba(color, 0.15),
    primaryRgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
  }
}

export type ThemeMode = 'light' | 'dark' | 'system'

export const presetColors = PRESET_COLORS

const themeColors = {
  light: LIGHT_THEME_COLORS,
  dark: DARK_THEME_COLORS,
} as const

/**
 * 创建 naive-ui 主题覆盖配置。
 * @param isDark - 是否为深色模式
 * @param primaryScale - 已计算好的主色色阶（由调用方基于响应式状态生成一次）
 * @returns naive-ui 主题覆盖对象
 */
function createThemeOverrides(
  isDark: boolean,
  primaryScale: ReturnType<typeof createPrimaryScale>
): GlobalThemeOverrides {
  const baseColors = isDark ? themeColors.dark : themeColors.light

  return {
    common: {
      primaryColor: primaryScale.primary,
      primaryColorHover: primaryScale.primaryHover,
      primaryColorPressed: primaryScale.primaryPressed,
      primaryColorSuppl: primaryScale.primaryHover,
      successColor: baseColors.success,
      warningColor: baseColors.warning,
      errorColor: baseColors.error,
      infoColor: baseColors.info,
      textColorBase: baseColors.text,
      textColor1: baseColors.text,
      textColor2: baseColors.textSecondary,
      textColor3: baseColors.textSecondary,
      bodyColor: 'transparent',
      cardColor: baseColors.cardBackground,
      modalColor: baseColors.surface,
      popoverColor: baseColors.surface,
      borderColor: baseColors.border,
      dividerColor: baseColors.border,
      borderRadius: '6px',
      borderRadiusSmall: '6px',
      fontFamily: 'var(--font-body)',
    },
    Button: {
      color: baseColors.background,
      colorHover: baseColors.backgroundHover,
      colorPressed: baseColors.backgroundHover,
      textColor: baseColors.text,
      textColorHover: primaryScale.primary,
      border: `1px solid ${rgba(primaryScale.primary, 0.22)}`,
      borderHover: `1px solid ${rgba(primaryScale.primary, 0.5)}`,
      borderPressed: `1px solid ${rgba(primaryScale.primary, 0.6)}`,
      borderFocus: `1px solid ${rgba(primaryScale.primary, 0.6)}`,
      boxShadowHover: `0 4px 14px ${rgba(primaryScale.primary, 0.16)}`,
      boxShadowFocus: `0 0 0 2px ${rgba(primaryScale.primary, 0.2)}`,
      heightMedium: '36px',
      heightSmall: '32px',
      borderRadiusMedium: '6px',
      borderRadiusSmall: '6px',
      fontWeight: '550',
      paddingMedium: '0 14px',
    },
    Card: {
      color: baseColors.cardBackground,
      borderColor: baseColors.border,
      borderRadius: '8px',
      boxShadow: '0 1px 2px rgba(29, 36, 51, 0.04)',
      paddingMedium: '16px',
    },
    Input: {
      color: baseColors.surface,
      colorFocus: baseColors.surface,
      border: `1px solid ${rgba(primaryScale.primary, 0.2)}`,
      borderHover: `1px solid ${rgba(primaryScale.primary, 0.5)}`,
      borderFocus: `1px solid ${rgba(primaryScale.primary, 0.65)}`,
      textColor: baseColors.text,
      placeholderColor: baseColors.textSecondary,
      heightMedium: '36px',
      heightSmall: '32px',
      borderRadius: '6px',
      boxShadowFocus: `0 0 0 2px ${rgba(primaryScale.primary, 0.18)}`,
    },
    Select: {
      color: baseColors.surface,
      colorActive: baseColors.backgroundHover,
      border: `1px solid ${rgba(primaryScale.primary, 0.2)}`,
      borderHover: `1px solid ${rgba(primaryScale.primary, 0.5)}`,
      borderActive: `1px solid ${rgba(primaryScale.primary, 0.65)}`,
      boxShadowFocus: `0 0 0 2px ${rgba(primaryScale.primary, 0.18)}`,
      menuBoxShadow: isDark
        ? '0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)'
        : '0 8px 24px rgba(21,31,52,0.10), inset 0 1px 0 rgba(255,255,255,0.55)',
    },
    Switch: {
      railColor: rgba(primaryScale.primary, 0.25),
      railColorActive: primaryScale.primary,
    },
    Slider: {
      fillColor: primaryScale.primary,
      railColor: rgba(primaryScale.primary, 0.2),
      handleBoxShadow: `0 0 0 4px ${rgba(primaryScale.primary, 0.12)}`,
    },
    Tooltip: {
      color: baseColors.surface,
      textColor: baseColors.text,
    },
    Dropdown: {
      color: baseColors.surface,
      optionColorHover: baseColors.backgroundHover,
    },
    Menu: {
      color: 'transparent',
      itemColorHover: baseColors.backgroundHover,
      itemTextColor: baseColors.text,
      itemTextColorHover: primaryScale.primary,
      itemColorActive: primaryScale.primaryLight,
      itemTextColorActive: primaryScale.primary,
      itemIconColorActive: primaryScale.primary,
      itemHeight: '40px',
      itemBorderRadius: '6px',
    },
    Dialog: {
      borderRadius: '10px',
      titleFontSize: '17px',
      padding: '20px',
    },
    Tabs: {
      tabColor: baseColors.cardBackground,
      tabBorderRadius: '6px',
      tabColorSegment: rgba(primaryScale.primary, 0.1),
      tabBorderColorSegment: rgba(primaryScale.primary, 0.15),
      tabFontSizeSmall: '12px',
    },
    Tag: {
      borderRadius: '5px',
    },
  }
}

// 单例级非响应式状态（系统监听/初始化缓存/Blob URL/保存防抖）
let systemThemeListenerInitialized = false
let initThemePromise: Promise<void> | null = null
let currentBgObjectUrl: string | null = null
let saveTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 主题全局状态（Pinia）。
 * 由 useTheme() 包装暴露，保持原有 API（readonly ref + setter 函数）。
 */
export const useThemeStore = defineStore('theme', () => {
  const themeMode = ref<ThemeMode>('system')
  const primaryColor = ref('')
  const backgroundImage = ref('')
  const backgroundImagePath = ref('')
  const backgroundOpacity = ref(1)
  const blurAmount = ref(0)
  const transparentBg = ref(false)
  const glassEffect = ref(true)
  const auroraEnabled = ref(true)
  const deriveMode = ref<DeriveMode>('off')
  const derivedPrimary = ref('')
  const derivedMonetSeed = ref('')
  const sidebarCollapsed = ref(true)
  const navigationMode = ref<NavigationMode>('sidebar')
  const isDark = ref(false)
  const systemDark = ref(false)

  const titlebarHidden = computed(() => navigationMode.value === 'sidebar')
  const naiveTheme = computed<GlobalTheme | null>(() => {
    return isDark.value ? darkTheme : null
  })

  /** 生效主色：开启背景取色且有提取色时使用派生色，否则用手动色 */
  const effectivePrimary = computed(() => {
    if (deriveMode.value === 'off') return primaryColor.value
    if (deriveMode.value === 'monet') return derivedMonetSeed.value || primaryColor.value
    return derivedPrimary.value || primaryColor.value
  })

  /** 主色色阶：Monet 模式用完整 tonal 色板，否则由 effectivePrimary 派生 */
  const primaryScale = computed(() => {
    if (deriveMode.value === 'monet' && derivedMonetSeed.value) {
      return createMonetScale(derivedMonetSeed.value, isDark.value)
    }
    return createPrimaryScale(effectivePrimary.value, isDark.value)
  })

  const themeOverrides = computed<GlobalThemeOverrides>(() => {
    return createThemeOverrides(isDark.value, primaryScale.value)
  })

  const colors = computed(() => {
    const baseColors = isDark.value ? themeColors.dark : themeColors.light

    return {
      ...baseColors,
      ...primaryScale.value,
    }
  })

  /**
   * 监听系统深色模式偏好变化。
   */
  function initSystemThemeListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemDark.value = mediaQuery.matches

    mediaQuery.addEventListener('change', (e) => {
      systemDark.value = e.matches
      if (themeMode.value === 'system') {
        updateTheme()
      }
    })
  }

  function updateTheme() {
    if (themeMode.value === 'system') {
      isDark.value = systemDark.value
    } else {
      isDark.value = themeMode.value === 'dark'
    }

    const bgImageValue = backgroundImage.value ? `url("${backgroundImage.value}")` : 'none'

    document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
    document.documentElement.setAttribute('data-glass', glassEffect.value ? '1' : '0')
    document.documentElement.setAttribute('data-aurora', auroraEnabled.value ? '1' : '0')
    document.documentElement.style.setProperty('--primary', primaryScale.value.primary)
    document.documentElement.style.setProperty('--primary-rgb', primaryScale.value.primaryRgb)
    document.documentElement.style.setProperty('--primary-hover', primaryScale.value.primaryHover)
    document.documentElement.style.setProperty('--primary-active', primaryScale.value.primaryPressed)
    document.documentElement.style.setProperty('--primary-alpha', primaryScale.value.primaryLight)
    const aurora = createAuroraColors(primaryScale.value.primary, isDark.value)
    document.documentElement.style.setProperty('--aurora-c1', aurora.c1)
    document.documentElement.style.setProperty('--aurora-c2', aurora.c2)
    document.documentElement.style.setProperty('--aurora-c3', aurora.c3)
    document.documentElement.style.setProperty('--bg-image', bgImageValue)
    document.documentElement.style.setProperty('--bg-opacity', String(backgroundOpacity.value))
    document.documentElement.style.setProperty('--bg-app', transparentBg.value ? 'transparent' : '')
    document.documentElement.style.setProperty('--bg-blur', `${blurAmount.value}px`)
    document.documentElement.style.setProperty('--main-bg-layer-opacity', transparentBg.value ? '1' : '0')

    document.documentElement.setAttribute('data-sidebar-collapsed', sidebarCollapsed.value ? '1' : '0')
    document.documentElement.setAttribute('data-navigation-mode', navigationMode.value)
    document.documentElement.setAttribute('data-titlebar-hidden', titlebarHidden.value ? '1' : '0')

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(
        '[updateTheme] --bg-image:',
        bgImageValue,
        'backgroundImage.length:',
        backgroundImage.value?.length ?? 0
      )
    }
  }

  function setThemeMode(mode: ThemeMode, persist = true) {
    themeMode.value = mode
    updateTheme()
    if (persist) saveThemeConfig()
  }

  function setPrimaryColor(color: string, persist = true) {
    // 手动选色时自动退出「从背景图提取主题色」模式
    if (deriveMode.value !== 'off') setDeriveMode('off', false)
    primaryColor.value = color
    updateTheme()
    if (persist) saveThemeConfig()
  }

  function dataUrlToBlobUrl(dataUrl: string): string {
    if (currentBgObjectUrl) {
      URL.revokeObjectURL(currentBgObjectUrl)
      currentBgObjectUrl = null
    }
    const [header, base64] = dataUrl.split(',')
    const mimeMatch = header?.match(/:(.*?);/)
    const mime = mimeMatch?.[1] || 'image/png'
    const binary = atob(base64 || '')
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: mime })
    currentBgObjectUrl = URL.createObjectURL(blob)
    return currentBgObjectUrl
  }

  function resolveImageUrl(url: string): string {
    // 超大的 data URL 直接写入 CSS 变量容易触发渲染/长度问题，转为 blob URL
    return url && url.startsWith('data:') && url.length > 100 * 1024 ? dataUrlToBlobUrl(url) : url
  }

  function preloadBackgroundImage(url: string): Promise<void> {
    return new Promise((resolve) => {
      const image = new Image()
      image.onload = () => resolve()
      image.onerror = () => {
        console.warn('[Theme] 背景图片加载失败:', url)
        resolve()
      }
      image.src = url
    })
  }

  /** 按当前取色模式从背景图提取主题色并同步 */
  async function deriveFromBackground() {
    if (deriveMode.value === 'off' || !backgroundImage.value) return
    const url = backgroundImage.value
    if (deriveMode.value === 'default') {
      const color = await extractPrimaryFromImage(url)
      derivedPrimary.value = color ?? ''
    } else {
      const seed = await monetSeedFromImage(url)
      derivedMonetSeed.value = seed ?? ''
    }
    updateTheme()
  }

  function setBackgroundImage(url: string, path?: string, persist = true) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[setBackgroundImage] url.length:', url?.length ?? 0, 'path:', path, 'persist:', persist)
    }
    backgroundImage.value = resolveImageUrl(url)
    if (path !== undefined) backgroundImagePath.value = path
    updateTheme()
    if (persist) saveThemeConfig()
    // 开启背景取色时，更换背景图自动重新提取主题色
    if (deriveMode.value !== 'off' && backgroundImage.value) {
      void deriveFromBackground()
    }
  }

  async function setDeriveMode(mode: DeriveMode, persist = true) {
    deriveMode.value = mode
    if (mode !== 'off') {
      if (backgroundImage.value) await deriveFromBackground()
    } else {
      derivedPrimary.value = ''
      derivedMonetSeed.value = ''
    }
    updateTheme()
    if (persist) {
      try {
        window.localStorage.setItem(DERIVE_MODE_STORAGE_KEY, mode)
      } catch {
        // localStorage 不可用时仅本次会话生效
      }
    }
  }

  function setBlurAmount(amount: number, persist = true) {
    blurAmount.value = amount
    updateTheme()
    if (persist) saveThemeConfig()
  }

  function setBackgroundOpacity(opacity: number, persist = true) {
    backgroundOpacity.value = opacity
    updateTheme()
    if (persist) saveThemeConfig()
  }

  function setTransparentBg(val: boolean, persist = true) {
    transparentBg.value = val
    updateTheme()
    if (persist) saveThemeConfig()
  }

  function setGlassEffect(val: boolean, persist = true) {
    glassEffect.value = val
    updateTheme()
    if (persist) {
      try {
        window.localStorage.setItem(GLASS_EFFECT_STORAGE_KEY, val ? '1' : '0')
      } catch {
        // localStorage 不可用时仅本次会话生效
      }
    }
  }

  function setAuroraEnabled(val: boolean, persist = true) {
    auroraEnabled.value = val
    updateTheme()
    if (persist) {
      try {
        window.localStorage.setItem(AURORA_STORAGE_KEY, val ? '1' : '0')
      } catch {
        // localStorage 不可用时仅本次会话生效
      }
    }
  }

  function setSidebarCollapsed(val: boolean) {
    sidebarCollapsed.value = val
    updateTheme()
    saveThemeConfig()
  }

  function setTitlebarHidden(val: boolean) {
    navigationMode.value = val ? 'sidebar' : 'top'
    updateTheme()
    saveThemeConfig()
  }

  function setNavigationMode(mode: NavigationMode) {
    navigationMode.value = mode
    updateTheme()
    saveThemeConfig()
  }

  async function saveThemeConfig() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(async () => {
      if (!settingsApi.isAvailable) return
      const ui = await settingsApi.getUi()
      await settingsApi.saveUi({
        ...ui,
        theme: {
          mode: themeMode.value,
          primary_color: primaryColor.value,
          blur_amount: blurAmount.value,
          sidebar_collapsed: sidebarCollapsed.value,
          navigation_mode: navigationMode.value,
          titlebar_hidden: titlebarHidden.value,
          transparent_bg: transparentBg.value,
          background_opacity: backgroundOpacity.value,
        },
        background: {
          ...(ui.background || {}),
          type: backgroundImage.value ? 'custom' : 'none',
          path: backgroundImagePath.value,
          opacity: backgroundOpacity.value,
        },
      })
    }, 100)
  }

  function toggleTheme() {
    if (themeMode.value === 'system') {
      setThemeMode(isDark.value ? 'light' : 'dark')
    } else {
      setThemeMode(themeMode.value === 'dark' ? 'light' : 'dark')
    }
  }

  /**
   * 初始化主题状态。
   * @param uiConfig - 后端推送的 UI 配置，首次调用后会被缓存
   */
  async function initTheme(uiConfig?: unknown): Promise<void> {
    if (!uiConfig && initThemePromise) {
      return initThemePromise
    }

    const payload = uiConfig as ThemeInitPayload | undefined

    const promise = (async () => {
      let backgroundChanged = false
      try {
        const storedGlass = window.localStorage.getItem(GLASS_EFFECT_STORAGE_KEY)
        if (storedGlass !== null) glassEffect.value = storedGlass === '1'
        const storedAurora = window.localStorage.getItem(AURORA_STORAGE_KEY)
        if (storedAurora !== null) auroraEnabled.value = storedAurora === '1'
        const storedDeriveMode = window.localStorage.getItem(DERIVE_MODE_STORAGE_KEY)
        if (storedDeriveMode === 'off' || storedDeriveMode === 'default' || storedDeriveMode === 'monet') {
          deriveMode.value = storedDeriveMode
        } else {
          // 兼容旧版布尔开关
          const storedLegacy = window.localStorage.getItem(DERIVE_THEME_COLOR_STORAGE_KEY)
          if (storedLegacy !== null) deriveMode.value = storedLegacy === '1' ? 'default' : 'off'
        }
      } catch {
        // 本地存储不可用时保持默认开启
      }
      if (payload?.theme) {
        const themeData = payload.theme
        if (themeData.mode) {
          themeMode.value = themeData.mode as ThemeMode
        }
        if (themeData.primary_color) {
          primaryColor.value = themeData.primary_color
        }
        if (typeof themeData.blur_amount === 'number') {
          blurAmount.value = themeData.blur_amount
        }
        if (typeof themeData.transparent_bg === 'boolean') {
          transparentBg.value = themeData.transparent_bg
        }
        if (typeof themeData.sidebar_collapsed === 'boolean') {
          sidebarCollapsed.value = themeData.sidebar_collapsed
        }
        navigationMode.value = resolveNavigationMode(themeData)
      }

      if (payload?.background) {
        backgroundChanged = true
        const bgData = payload.background
        backgroundImagePath.value = bgData.path ?? ''

        if (bgData.image_base64) {
          backgroundImage.value = resolveImageUrl(bgData.image_base64)
        } else if (settingsApi.isShowcase && bgData.path?.startsWith('http')) {
          backgroundImage.value = bgData.path
        } else if (bgData.path && bgData.type !== 'default') {
          // 桌面端统一通过后端读取 Base64，并将大图转换为 Blob URL 供 CSS 使用
          const imageUrl = await resolveLocalImageUrl(bgData.path)
          backgroundImage.value = imageUrl ? resolveImageUrl(imageUrl) : ''
        } else {
          backgroundImage.value = ''
        }

        if (typeof bgData.opacity === 'number') {
          backgroundOpacity.value = bgData.opacity
        }
      }

      if (backgroundChanged && backgroundImage.value) {
        await preloadBackgroundImage(backgroundImage.value)
      }

      // 开启背景取色时，对初始背景图提取主题色
      if (deriveMode.value !== 'off' && backgroundImage.value) {
        await deriveFromBackground()
      }

      if (!systemThemeListenerInitialized) {
        initSystemThemeListener()
        systemThemeListenerInitialized = true
      }
      updateTheme()
    })()

    if (!uiConfig) {
      initThemePromise = promise
    }

    return promise
  }

  return {
    themeMode,
    primaryColor,
    backgroundImage,
    backgroundImagePath,
    backgroundOpacity,
    blurAmount,
    transparentBg,
    glassEffect,
    auroraEnabled,
    deriveMode,
    sidebarCollapsed,
    navigationMode,
    titlebarHidden,
    isDark,
    systemDark,
    naiveTheme,
    themeOverrides,
    colors,
    initSystemThemeListener,
    updateTheme,
    setThemeMode,
    setPrimaryColor,
    setBackgroundImage,
    setBlurAmount,
    setBackgroundOpacity,
    setTransparentBg,
    setGlassEffect,
    setAuroraEnabled,
    setDeriveMode,
    setSidebarCollapsed,
    setTitlebarHidden,
    setNavigationMode,
    saveThemeConfig,
    toggleTheme,
    initTheme,
  }
})

/**
 * 初始化主题状态（模块级入口，供 main.ts 在 app.use(pinia) 之前调用）。
 * @param uiConfig - 后端推送的 UI 配置，首次调用后会被缓存
 */
export async function initTheme(uiConfig?: unknown): Promise<void> {
  return useThemeStore(pinia).initTheme(uiConfig)
}

/**
 * 获取全局主题状态及操作方法。
 * @returns 主题相关的响应式状态与 setter
 */
export function useTheme() {
  const store = useThemeStore(pinia)
  const {
    themeMode,
    primaryColor,
    backgroundImage,
    backgroundImagePath,
    backgroundOpacity,
    blurAmount,
    transparentBg,
    glassEffect,
    auroraEnabled,
    deriveMode,
    sidebarCollapsed,
    navigationMode,
    titlebarHidden,
    isDark,
    naiveTheme,
    themeOverrides,
    colors,
  } = storeToRefs(store)
  return {
    themeMode: readonly(themeMode),
    primaryColor: readonly(primaryColor),
    backgroundImage: readonly(backgroundImage),
    backgroundImagePath: readonly(backgroundImagePath),
    backgroundOpacity: readonly(backgroundOpacity),
    blurAmount: readonly(blurAmount),
    transparentBg: readonly(transparentBg),
    glassEffect: readonly(glassEffect),
    auroraEnabled: readonly(auroraEnabled),
    deriveMode: readonly(deriveMode),
    sidebarCollapsed: readonly(sidebarCollapsed),
    navigationMode: readonly(navigationMode),
    titlebarHidden: readonly(titlebarHidden),
    isDark: readonly(isDark),
    naiveTheme,
    themeOverrides,
    colors,
    setThemeMode: store.setThemeMode,
    setPrimaryColor: store.setPrimaryColor,
    setBackgroundImage: store.setBackgroundImage,
    setBlurAmount: store.setBlurAmount,
    setTransparentBg: store.setTransparentBg,
    setGlassEffect: store.setGlassEffect,
    setAuroraEnabled: store.setAuroraEnabled,
    setDeriveMode: store.setDeriveMode,
    setBackgroundOpacity: store.setBackgroundOpacity,
    setSidebarCollapsed: store.setSidebarCollapsed,
    setNavigationMode: store.setNavigationMode,
    setTitlebarHidden: store.setTitlebarHidden,
    toggleTheme: store.toggleTheme,
    initTheme,
    updateTheme: store.updateTheme,
  }
}
