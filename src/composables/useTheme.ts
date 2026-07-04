import { ref, computed, watch, type Ref } from 'vue'
import type { GlobalTheme, GlobalThemeOverrides } from 'naive-ui'
import { darkTheme } from 'naive-ui'
import backend from '@/api/client'

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function normalizeHex(hex: string): string {
  hex = hex.replace(/^#/, '')
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('')
  }
  return `#${hex}`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  hex = normalizeHex(hex)
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) throw new Error('Invalid hex color')

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
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

function createPrimaryScale(baseColor: string): {
  primary: string
  primaryHover: string
  primaryPressed: string
  primaryLight: string
  primaryRgb: string
} {
  const rgb = hexToRgb(baseColor)

  return {
    primary: baseColor,
    primaryHover: mix(baseColor, isDark.value ? '#ffffff' : '#000000', 0.15),
    primaryPressed: mix(baseColor, isDark.value ? '#ffffff' : '#000000', 0.3),
    primaryLight: rgba(baseColor, 0.15),
    primaryRgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`
  }
}

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeState {
  mode: ThemeMode
  followSystem: boolean
}

// 预设主题色（EuoraCraft 品牌色系）
export const presetColors = [
  { name: '品牌蓝', value: '#4A7FD9' },
  { name: '天空蓝', value: '#5B9BD5' },
  { name: '薄荷绿', value: '#52A37F' },
  { name: '珊瑚橙', value: '#D4755B' },
  { name: '薰衣草', value: '#8B7FD9' },
  { name: '石墨灰', value: '#6A6D74' },
]

const themeColors = {
  light: {
    success: '#52c41a',
    warning: '#faad14',
    error: '#E55C5C',
    info: '#4A7FD9',
    background: 'rgba(255, 255, 255, 0.92)',
    backgroundHover: 'rgba(255, 255, 255, 0.96)',
    surface: 'rgba(255, 255, 255, 0.92)',
    text: '#1A1A1A',
    textSecondary: '#5C5C5C',
    border: 'rgba(0, 0, 0, 0.06)',
    shadow: 'none',
  },
  dark: {
    success: '#52c41a',
    warning: '#faad14',
    error: '#E55C5C',
    info: '#4A7FD9',
    background: 'rgba(35, 38, 45, 0.92)',
    backgroundHover: 'rgba(45, 48, 55, 0.96)',
    surface: 'rgba(35, 38, 45, 0.92)',
    text: '#E8E9EB',
    textSecondary: '#A0A3A8',
    border: 'rgba(255, 255, 255, 0.08)',
    shadow: 'none',
  }
} as const

function createThemeOverrides(isDark: boolean, primary: string): GlobalThemeOverrides {
  const baseColors = isDark ? themeColors.dark : themeColors.light
  const primaryScale = createPrimaryScale(primary)

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
      cardColor: baseColors.background,
      modalColor: baseColors.surface,
      popoverColor: baseColors.surface,
      borderColor: baseColors.border,
      dividerColor: baseColors.border,
    },
    Button: {
      color: baseColors.background,
      colorHover: baseColors.backgroundHover,
      colorPressed: baseColors.backgroundHover,
      textColor: baseColors.text,
      textColorHover: primaryScale.primary,
      border: `1px solid ${baseColors.border}`,
      borderHover: `1px solid ${primaryScale.primary}`,
    },
    Card: {
      color: baseColors.background,
      borderColor: baseColors.border,
    },
    Input: {
      color: baseColors.surface,
      colorFocus: baseColors.surface,
      border: `1px solid ${baseColors.border}`,
      borderHover: `1px solid ${primaryScale.primary}`,
      borderFocus: `1px solid ${primaryScale.primary}`,
      textColor: baseColors.text,
      placeholderColor: baseColors.textSecondary,
    },
    Select: {
      color: baseColors.surface,
      colorActive: baseColors.backgroundHover,
      border: `1px solid ${baseColors.border}`,
      borderHover: `1px solid ${primaryScale.primary}`,
      borderActive: `1px solid ${primaryScale.primary}`,
    },
    Switch: {
      railColor: baseColors.textSecondary,
      railColorActive: primaryScale.primary,
    },
    Slider: {
      fillColor: primaryScale.primary,
      railColor: baseColors.border,
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
      color: baseColors.background,
      itemColorHover: baseColors.backgroundHover,
      itemTextColor: baseColors.text,
      itemTextColorHover: primaryScale.primary,
    },
  }
}

// 状态
let systemThemeListenerInitialized = false
let initThemePromise: Promise<void> | null = null

const themeMode = ref<ThemeMode>('system')
const primaryColor = ref('#4A7FD9')  // 默认品牌蓝
const backgroundImage = ref('')
const backgroundImagePath = ref('')
const backgroundOpacity = ref(0.2)  // 默认 20% 亮度
const blurAmount = ref(0)  // 禁用 backdrop-filter blur
const sidebarCollapsed = ref(true)
const titlebarHidden = ref(true)
const isDark = ref(false)
const systemDark = ref(false)

const naiveTheme = computed<GlobalTheme | null>(() => {
  return isDark.value ? darkTheme : null
})

const themeOverrides = computed<GlobalThemeOverrides>(() => {
  return createThemeOverrides(isDark.value, primaryColor.value)
})

const colors = computed(() => {
  const baseColors = isDark.value ? themeColors.dark : themeColors.light
  const primaryScale = createPrimaryScale(primaryColor.value)

  return {
    ...baseColors,
    ...primaryScale
  }
})

// 监听系统主题
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

  const primaryScale = createPrimaryScale(primaryColor.value)

  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  document.documentElement.style.setProperty('--primary', primaryScale.primary)
  document.documentElement.style.setProperty('--primary-rgb', primaryScale.primaryRgb)
  document.documentElement.style.setProperty('--primary-hover', primaryScale.primaryHover)
  document.documentElement.style.setProperty('--primary-active', primaryScale.primaryPressed)
  document.documentElement.style.setProperty('--primary-alpha', primaryScale.primaryLight)
  document.documentElement.style.setProperty('--bg-image', backgroundImage.value ? `url("${backgroundImage.value}")` : 'none')
  document.documentElement.style.setProperty('--bg-opacity', String(backgroundOpacity.value))
  document.documentElement.style.setProperty('--bg-blur', '0px')

  document.documentElement.setAttribute('data-sidebar-collapsed', sidebarCollapsed.value ? '1' : '0')
  document.documentElement.setAttribute('data-titlebar-hidden', titlebarHidden.value ? '1' : '0')
}

function setThemeMode(mode: ThemeMode) {
  themeMode.value = mode
  updateTheme()
  saveThemeConfig()
}

function setPrimaryColor(color: string) {
  primaryColor.value = color
  updateTheme()
  saveThemeConfig()
}

function setBackgroundImage(url: string, path?: string) {
  backgroundImage.value = url
  if (path !== undefined) backgroundImagePath.value = path
  updateTheme()
  saveThemeConfig()
}

function setBlurAmount(amount: number) {
  blurAmount.value = amount
  updateTheme()
  saveThemeConfig()
}

function setBackgroundOpacity(opacity: number) {
  backgroundOpacity.value = opacity
  updateTheme()
}

function setSidebarCollapsed(val: boolean) {
  sidebarCollapsed.value = val
  updateTheme()
  saveThemeConfig()
}

function setTitlebarHidden(val: boolean) {
  titlebarHidden.value = val
  updateTheme()
  saveThemeConfig()
}

let saveTimer: any = null
async function saveThemeConfig() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    if ((window as any).__TAURI__?.pytauri) {
      try {
        const uiRes = await backend.config.get('ui')
        const ui = uiRes.data || {}
        await backend.config.set('ui', {
          ...ui,
          theme: {
            mode: themeMode.value,
            primary_color: primaryColor.value,
            blur_amount: 0,
            sidebar_collapsed: sidebarCollapsed.value,
            titlebar_hidden: titlebarHidden.value,
          },
        })
      } catch (error) {
        console.error('保存主题配置失败:', error)
      }
    }
  }, 100)
}

function toggleTheme() {
  if (themeMode.value === 'system') {
    setThemeMode(isDark.value ? 'light' : 'dark')
  } else {
    setThemeMode(themeMode.value === 'dark' ? 'light' : 'dark')
  }
}

export async function initTheme(
  preloadedUi?: { success: boolean; data: any } | null
): Promise<void> {
  if (!preloadedUi && initThemePromise) {
    return initThemePromise
  }

  const promise = (async () => {
    try {
      if ((window as any).__TAURI__?.pytauri) {
        const uiConfig = preloadedUi
          ? Promise.resolve(preloadedUi)
          : await backend.config.get('ui').catch(() => ({ success: false, data: null }))

        if (uiConfig.success && uiConfig.data) {
          const themeData = uiConfig.data.theme || {}
          themeMode.value = themeData.mode as ThemeMode || 'system'
          primaryColor.value = themeData.primary_color || '#4A7FD9'
          blurAmount.value = 0
          sidebarCollapsed.value = themeData.sidebar_collapsed ?? true
          titlebarHidden.value = themeData.titlebar_hidden ?? false

          const bgData = uiConfig.data.background || {}
          backgroundImagePath.value = bgData.path || ''

          if (bgData.path && bgData.type !== 'default') {
            try {
              const imgData = await backend.command('image_read_file', { path: bgData.path })
              if (imgData.success && imgData.data?.base64) {
                backgroundImage.value = imgData.data.base64
              }
            } catch (error) {
              console.warn('加载背景图片失败:', error)
              backgroundImage.value = ''
            }
          }

          if (typeof bgData.opacity === 'number') {
            backgroundOpacity.value = bgData.opacity
          }
        }
      }
    } catch (error) {
      console.error('初始化主题失败:', error)
      themeMode.value = 'system'
      primaryColor.value = '#4A7FD9'
      backgroundImage.value = ''
      blurAmount.value = 0
    }

    if (!systemThemeListenerInitialized) {
      initSystemThemeListener()
      systemThemeListenerInitialized = true
    }
    updateTheme()
  })()

  if (!preloadedUi) {
    initThemePromise = promise
  }

  return promise
}

export function useTheme() {
  return {
    themeMode,
    primaryColor,
    backgroundImage,
    backgroundImagePath,
    backgroundOpacity,
    blurAmount,
    sidebarCollapsed,
    titlebarHidden,
    isDark,
    naiveTheme,
    themeOverrides,
    colors,
    setThemeMode,
    setPrimaryColor,
    setBackgroundImage,
    setBlurAmount,
    setBackgroundOpacity,
    setSidebarCollapsed,
    setTitlebarHidden,
    toggleTheme,
    initTheme,
    updateTheme,
  }
}

// 全局状态
export const globalThemeState = {
  themeMode,
  primaryColor,
  backgroundImage,
  backgroundImagePath,
  backgroundOpacity,
  blurAmount,
  isDark,
  naiveTheme,
  themeOverrides,
  colors,
  setThemeMode,
  setPrimaryColor,
  setBackgroundImage,
  setBackgroundOpacity,
  toggleTheme,
  initTheme,
}
