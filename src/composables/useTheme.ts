import { ref, computed, watch, type Ref } from 'vue'
import type { GlobalTheme, GlobalThemeOverrides } from 'naive-ui'
import { darkTheme } from 'naive-ui'
import { api } from '@/api/client'


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

const THEME_KEY = 'euoracraft-theme'
const COLOR_KEY = 'euoracraft-primary-color'
const BG_IMAGE_KEY = 'euoracraft-bg-image'
const BLUR_KEY = 'euoracraft-blur-amount'

// 预设主题色
export const presetColors = [
  //{ name: '天蓝色', value: '#87CEEB' },
  //{ name: '樱花粉', value: '#FFB6C1' },
  //{ name: '薄荷绿', value: '#98E4D6' },
  //{ name: '薰衣草紫', value: '#E6E6FA' },
  { name: '默认蓝', value: '#0078d4' },
  { name: '极客绿', value: '#107c10' },
  { name: '活力橙', value: '#FF9F43' },
  { name: '热情红', value: '#FF6B6B' },
]

const themeColors = {
  light: {
    success: '#52C41A',
    warning: '#FAAD14',
    error: '#FF6B6B',
    info: '#0078d4',
    background: 'rgba(248, 250, 252, 0.65)',
    backgroundHover: 'rgba(255, 255, 255, 0.8)',
    surface: 'rgba(255, 255, 255, 0.9)',
    text: '#1E293B',
    textSecondary: '#64748B',
    border: 'rgba(0, 120, 212, 0.3)',
    shadow: 'rgba(0, 120, 212, 0.2)',
  },
  dark: {
    success: '#6DD576',
    warning: '#FFD666',
    error: '#FF7875',
    info: '#0078d4',
    background: 'rgba(15, 23, 42, 0.65)',
    backgroundHover: 'rgba(30, 41, 59, 0.8)',
    surface: 'rgba(30, 41, 59, 0.9)',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    border: 'rgba(0, 120, 212, 0.2)',
    shadow: 'rgba(0, 0, 0, 0.4)',
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
const primaryColor = ref('#0078d4') // 默认蓝色
const backgroundImage = ref('') // 默认无背景图
const backgroundImagePath = ref('') // 背景图路径
const blurAmount = ref(6)
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
  document.documentElement.style.setProperty('--color-primary', primaryScale.primary)
  document.documentElement.style.setProperty('--color-primary-rgb', primaryScale.primaryRgb)
  document.documentElement.style.setProperty('--color-primary-hover', primaryScale.primaryHover)
  document.documentElement.style.setProperty('--color-primary-active', primaryScale.primaryPressed)
  document.documentElement.style.setProperty('--color-primary-light', primaryScale.primaryLight)
  document.documentElement.style.setProperty('--bg-image', backgroundImage.value ? `url("${backgroundImage.value}")` : 'none')
  document.documentElement.style.setProperty('--bg-blur', `${blurAmount.value}px`)

  localStorage.setItem(THEME_KEY, JSON.stringify({
    mode: themeMode.value,
    followSystem: themeMode.value === 'system'
  }))
  localStorage.setItem(COLOR_KEY, primaryColor.value)
  localStorage.setItem(BG_IMAGE_KEY, backgroundImagePath.value)
  localStorage.setItem(BLUR_KEY, blurAmount.value.toString())
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

let saveTimer: any = null
async function saveThemeConfig() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    if (window.pywebview?.api) {
      try {
        await api.updateThemeConfig({
          mode: themeMode.value,
          primary_color: primaryColor.value,
          blur_amount: blurAmount.value
        })
      } catch (error) {
        console.error('保存主题配置失败:', error)
      }
    }
    localStorage.setItem(THEME_KEY, JSON.stringify({
      mode: themeMode.value,
      followSystem: themeMode.value === 'system'
    }))
    localStorage.setItem(COLOR_KEY, primaryColor.value)
    localStorage.setItem(BG_IMAGE_KEY, backgroundImagePath.value)
    localStorage.setItem(BLUR_KEY, blurAmount.value.toString())
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
  preloadedTheme?: { success: boolean; data: any } | null,
  preloadedBg?: { success: boolean; data: any } | null
): Promise<void> {
  // 如果没有预加载配置且已经在初始化中，则等待
  if (!preloadedTheme && !preloadedBg && initThemePromise) {
    return initThemePromise
  }

  const promise = (async () => {
    try {
      const savedBgImage = localStorage.getItem(BG_IMAGE_KEY)
      if (savedBgImage?.startsWith('data:') && savedBgImage.length > 1000) {
        localStorage.removeItem(BG_IMAGE_KEY)
      }
      
      if (window.pywebview?.api) {
        // 优先从后端加载配置，如果传入了预加载配置则直接使用
        const [themeConfig, bgConfig] = await Promise.all([
          preloadedTheme ? Promise.resolve(preloadedTheme) : api.getThemeConfig().catch(() => ({ success: false, data: null })),
          preloadedBg ? Promise.resolve(preloadedBg) : api.getBackgroundConfig().catch(() => ({ success: false, data: null }))
        ])
        
        // 应用主题配置
        if (themeConfig.success && themeConfig.data) {
          themeMode.value = themeConfig.data.mode as ThemeMode || 'system'
          primaryColor.value = themeConfig.data.primary_color || '#0078d4'
          blurAmount.value = themeConfig.data.blur_amount || 6
        } else {
          // 后端配置失败，回退到本地存储
          const saved = localStorage.getItem(THEME_KEY)
          if (saved) themeMode.value = (JSON.parse(saved) as ThemeState).mode
          primaryColor.value = localStorage.getItem(COLOR_KEY) || '#0078d4'
          blurAmount.value = parseInt(localStorage.getItem(BLUR_KEY) || '6')
        }
        
        // 应用背景图配置
        if (bgConfig.success && bgConfig.data) {
          backgroundImagePath.value = bgConfig.data.path || ''
          
          // 加载背景图片数据
          if (bgConfig.data.path && bgConfig.data.type !== 'default') {
            try {
              const imgData = await api.getBackgroundImage()
              if (imgData.success && imgData.data?.base64) {
                backgroundImage.value = imgData.data.base64
              }
            } catch (error) {
              console.warn('加载背景图片失败:', error)
              backgroundImage.value = ''
            }
          }
          
          // 应用背景模糊设置
          if (typeof bgConfig.data.blur === 'number') {
            blurAmount.value = bgConfig.data.blur
          }
        } else {
          // 后端配置失败，回退到本地存储
          const savedPath = localStorage.getItem(BG_IMAGE_KEY)
          if (savedPath && !savedPath.startsWith('data:')) {
            backgroundImagePath.value = savedPath
          }
        }
      } else {
        // 没有后端API，使用本地存储
        const saved = localStorage.getItem(THEME_KEY)
        if (saved) themeMode.value = (JSON.parse(saved) as ThemeState).mode
        primaryColor.value = localStorage.getItem(COLOR_KEY) || '#0078d4'
        const savedPath = localStorage.getItem(BG_IMAGE_KEY)
        if (savedPath && !savedPath.startsWith('data:')) {
          backgroundImagePath.value = savedPath
        }
        const savedBlur = localStorage.getItem(BLUR_KEY)
        if (savedBlur) blurAmount.value = parseInt(savedBlur)
      }
    } catch (error) {
      console.error('初始化主题失败:', error)
      themeMode.value = 'system'
      primaryColor.value = '#0078d4'
      backgroundImage.value = ''
      blurAmount.value = 6
    }
    
    if (!systemThemeListenerInitialized) {
      initSystemThemeListener()
      systemThemeListenerInitialized = true
    }
    updateTheme()
  })()

  // 只有在没有预加载配置时才缓存 Promise（表示首次本地初始化）
  if (!preloadedTheme && !preloadedBg) {
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
    blurAmount,
    isDark,
    naiveTheme,
    themeOverrides,
    colors,
    setThemeMode,
    setPrimaryColor,
    setBackgroundImage,
    setBlurAmount,
    toggleTheme,
    initTheme,
    updateTheme, // 导出updateTheme以便直接调用而不触发保存
  }
}

// 全局状态
export const globalThemeState = {
  themeMode,
  primaryColor,
  backgroundImage,
  backgroundImagePath,
  blurAmount,
  isDark,
  naiveTheme,
  themeOverrides,
  colors,
  setThemeMode,
  setPrimaryColor,
  setBackgroundImage,
  setBlurAmount,
  toggleTheme,
  initTheme,
}