import { darkTheme, type GlobalTheme, type GlobalThemeOverrides } from 'naive-ui'
import { defineStore, storeToRefs } from 'pinia'
import { computed, readonly, ref } from 'vue'
import { pinia } from '@/app/stores'
import {
  CARD_OPACITY_DEFAULT,
  DEFAULT_PRIMARY_COLOR,
  DARK_THEME_COLORS,
  LIGHT_THEME_COLORS,
  PRESET_COLORS,
} from '@/config/theme'
import { resolveLocalImageUrl, settingsApi } from '@/features/settings/api/settingsApi'
import { resolveNavigationMode } from '@/features/settings/model/navigation'
import type {
  BackgroundConfig,
  NavigationMode,
  ThemeAppearanceConfig,
  ThemeConfig,
  ThemeScheduleConfig,
} from '@/types/api'

interface ThemeInitPayload {
  theme?: Partial<ThemeConfig>
  background?: Partial<BackgroundConfig>
}

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

/** 解析 'HH:MM' 为当天分钟数；非法输入返回 -1。 */
function parseTimeMinutes(value: string | undefined): number {
  if (!value) return -1
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!match) return -1
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return -1
  return hours * 60 + minutes
}

const THEME_SNAPSHOT_KEY = 'euoracraft-theme-snapshot'

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
 * @param _appearance - 外观配置快照（半径/字体/卡片透明度），仅用于驱动重算
 * @returns naive-ui 主题覆盖对象
 */
function createThemeOverrides(
  isDark: boolean,
  primaryScale: ReturnType<typeof createPrimaryScale>,
  _appearance: ThemeAppearanceConfig
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
      borderRadius: 'var(--ecl-radius-control, 6px)',
      borderRadiusSmall: 'var(--ecl-radius-control, 6px)',
      fontFamily: 'var(--ecl-font-body, var(--font-body))',
    },
    Button: {
      color: baseColors.background,
      colorHover: baseColors.backgroundHover,
      colorPressed: baseColors.backgroundHover,
      textColor: baseColors.text,
      textColorHover: primaryScale.primary,
      border: `1px solid ${baseColors.border}`,
      borderHover: `1px solid ${primaryScale.primary}`,
      heightMedium: 'var(--ecl-control-height, 36px)',
      heightSmall: 'var(--ecl-control-height-sm, 32px)',
      borderRadiusMedium: 'var(--ecl-radius-control, 6px)',
      borderRadiusSmall: 'var(--ecl-radius-control, 6px)',
      fontWeight: '550',
      paddingMedium: '0 14px',
    },
    Card: {
      color: baseColors.cardBackground,
      borderColor: baseColors.border,
      borderRadius: 'var(--ecl-radius-card, 8px)',
      boxShadow: 'var(--ecl-shadow-surface, 0 1px 2px rgba(29, 36, 51, 0.04))',
      paddingMedium: '16px',
    },
    Input: {
      color: baseColors.surface,
      colorFocus: baseColors.surface,
      border: `1px solid ${baseColors.border}`,
      borderHover: `1px solid ${primaryScale.primary}`,
      borderFocus: `1px solid ${primaryScale.primary}`,
      textColor: baseColors.text,
      placeholderColor: baseColors.textSecondary,
      heightMedium: 'var(--ecl-control-height, 36px)',
      heightSmall: 'var(--ecl-control-height-sm, 32px)',
      borderRadius: 'var(--ecl-radius-control, 6px)',
      boxShadowFocus: `0 0 0 2px ${rgba(primaryScale.primary, 0.16)}`,
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
      borderRadius: 'var(--ecl-radius-dialog, 10px)',
      titleFontSize: '17px',
      padding: '20px',
    },
    Tabs: {
      tabBorderRadius: '6px',
      tabColorSegment: baseColors.backgroundHover,
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
  const themeId = ref<'classic' | 'folia'>('classic')
  const themeMode = ref<ThemeMode>('system')
  const primaryColor = ref('')
  const backgroundImage = ref('')
  const backgroundImagePath = ref('')
  const backgroundOpacity = ref(1)
  const blurAmount = ref(0)
  const transparentBg = ref(false)
  const sidebarCollapsed = ref(true)
  const navigationMode = ref<NavigationMode>('sidebar')
  const systemDark = ref(false)
  /** 用户级外观覆盖（圆角/字体/卡片透明度）。未设置的字段交由默认值决定。 */
  const appearance = ref<ThemeAppearanceConfig>({})
  /** 定时自动切换亮暗（仅在 system 模式生效）。 */
  const schedule = ref<ThemeScheduleConfig>({})
  /** 定时器心跳，驱动 system 模式下按时间重算。 */
  const scheduleTick = ref(0)
  let scheduleTimer: ReturnType<typeof setInterval> | null = null

  const titlebarHidden = computed(() => navigationMode.value === 'sidebar')

  /** system 模式下的有效深色判定：启用定时则按时间窗口，否则跟随系统。 */
  const effectiveSystemDark = computed(() => {
    const conf = schedule.value
    if (conf.enabled) {
      const startMinutes = parseTimeMinutes(conf.dark_start)
      const endMinutes = parseTimeMinutes(conf.dark_end)
      if (startMinutes >= 0 && endMinutes >= 0) {
        const now = new Date()
        const nowMinutes = now.getHours() * 60 + now.getMinutes()
        if (startMinutes === endMinutes) return true
        if (startMinutes < endMinutes) return nowMinutes >= startMinutes && nowMinutes < endMinutes
        return nowMinutes >= startMinutes || nowMinutes < endMinutes
      }
    }
    return systemDark.value
  })

  const isDark = computed(() => {
    if (themeMode.value === 'dark') return true
    if (themeMode.value === 'light') return false
    return effectiveSystemDark.value
  })

  const naiveTheme = computed<GlobalTheme | null>(() => {
    return isDark.value ? darkTheme : null
  })

  /** 主色色阶：由 primaryColor + isDark 派生，仅计算一次供 themeOverrides/colors/updateTheme 复用 */
  const primaryScale = computed(() => createPrimaryScale(primaryColor.value, isDark.value))

  const themeOverrides = computed<GlobalThemeOverrides>(() => {
    return createThemeOverrides(isDark.value, primaryScale.value, appearance.value)
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

  /** 写入用户级外观覆盖变量；未设置的字段不写，交由默认值决定。 */
  function applyAppearanceVars(): void {
    const el = document.documentElement
    const conf = appearance.value
    if (typeof conf.radius_control === 'number')
      el.style.setProperty('--ecl-radius-control', `${conf.radius_control}px`)
    if (typeof conf.radius_card === 'number') el.style.setProperty('--ecl-radius-card', `${conf.radius_card}px`)
    if (typeof conf.radius_dialog === 'number') el.style.setProperty('--ecl-radius-dialog', `${conf.radius_dialog}px`)
    if (conf.font_family) el.style.setProperty('--ecl-font-body', conf.font_family)
    el.style.setProperty('--card-opacity', String((conf.card_opacity ?? CARD_OPACITY_DEFAULT) / 100))
  }

  /** 持久化当前主题到 localStorage，供 index.html 内联脚本启动时无闪烁恢复。 */
  function saveSnapshot(): void {
    try {
      const scale = primaryScale.value
      localStorage.setItem(
        THEME_SNAPSHOT_KEY,
        JSON.stringify({
          theme: isDark.value ? 'dark' : 'light',
          uiSkin: themeId.value,
          primary: scale.primary,
          primaryRgb: scale.primaryRgb,
          primaryHover: scale.primaryHover,
          primaryActive: scale.primaryPressed,
          primaryAlpha: scale.primaryLight,
        })
      )
    } catch {
      /* localStorage 不可用时跳过快照 */
    }
  }

  function updateTheme() {
    const bgImageValue = backgroundImage.value ? `url("${backgroundImage.value}")` : 'none'

    document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
    document.documentElement.dataset.uiSkin = themeId.value
    document.documentElement.style.setProperty('--primary', primaryScale.value.primary)
    document.documentElement.style.setProperty('--ecl-primary', primaryScale.value.primary)
    document.documentElement.style.setProperty('--primary-rgb', primaryScale.value.primaryRgb)
    document.documentElement.style.setProperty('--primary-hover', primaryScale.value.primaryHover)
    document.documentElement.style.setProperty('--ecl-primary-hover', primaryScale.value.primaryHover)
    document.documentElement.style.setProperty('--primary-active', primaryScale.value.primaryPressed)
    document.documentElement.style.setProperty('--ecl-primary-active', primaryScale.value.primaryPressed)
    document.documentElement.style.setProperty('--primary-alpha', primaryScale.value.primaryLight)
    document.documentElement.style.setProperty('--bg-image', bgImageValue)
    document.documentElement.style.setProperty('--bg-opacity', String(backgroundOpacity.value))
    document.documentElement.style.setProperty('--bg-app', transparentBg.value ? 'transparent' : '')
    document.documentElement.style.setProperty('--bg-blur', `${blurAmount.value}px`)
    document.documentElement.style.setProperty('--main-bg-layer-opacity', transparentBg.value ? '1' : '0')

    document.documentElement.setAttribute('data-sidebar-collapsed', sidebarCollapsed.value ? '1' : '0')
    document.documentElement.setAttribute('data-navigation-mode', navigationMode.value)
    document.documentElement.setAttribute('data-titlebar-hidden', titlebarHidden.value ? '1' : '0')

    applyAppearanceVars()
    saveSnapshot()

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

  /** 亮暗切换时短暂开启过渡类，让颜色平滑变化；系统减少动效时会自动禁用。 */
  function withThemeTransition(fn: () => void): void {
    const el = document.documentElement
    el.classList.add('theme-transition')
    fn()
    window.setTimeout(() => el.classList.remove('theme-transition'), 320)
  }

  function setThemeMode(mode: ThemeMode, persist = true) {
    themeMode.value = mode
    withThemeTransition(updateTheme)
    if (persist) saveThemeConfig()
  }

  /** 切换到内置皮肤（classic/folia），并写入 data-ui-skin 驱动布局差异。 */
  function setThemeId(id: 'classic' | 'folia', persist = true) {
    themeId.value = id
    updateTheme()
    if (persist) saveThemeConfig()
  }

  function setPrimaryColor(color: string, persist = true) {
    primaryColor.value = color
    updateTheme()
    if (persist) saveThemeConfig()
  }

  /** 局部更新用户级外观覆盖。传入 undefined 可清除某个字段。 */
  function setAppearance(patch: Partial<ThemeAppearanceConfig>, persist = true) {
    appearance.value = { ...appearance.value, ...patch }
    updateTheme()
    if (persist) saveThemeConfig()
  }

  function setSchedule(patch: Partial<ThemeScheduleConfig>, persist = true) {
    schedule.value = { ...schedule.value, ...patch }
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

  function setBackgroundImage(url: string, path?: string, persist = true) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[setBackgroundImage] url.length:', url?.length ?? 0, 'path:', path, 'persist:', persist)
    }
    backgroundImage.value = resolveImageUrl(url)
    if (path !== undefined) backgroundImagePath.value = path
    updateTheme()
    if (persist) saveThemeConfig()
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
          theme_id: themeId.value,
          primary_color: primaryColor.value,
          blur_amount: blurAmount.value,
          sidebar_collapsed: sidebarCollapsed.value,
          navigation_mode: navigationMode.value,
          titlebar_hidden: titlebarHidden.value,
          transparent_bg: transparentBg.value,
          background_opacity: backgroundOpacity.value,
          appearance: appearance.value,
          schedule: schedule.value,
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
      if (payload?.theme) {
        const themeData = payload.theme
        if (themeData.mode) {
          themeMode.value = themeData.mode
        }
        if (themeData.theme_id === 'classic' || themeData.theme_id === 'folia') {
          themeId.value = themeData.theme_id
        }
        if (themeData.appearance) {
          appearance.value = { ...themeData.appearance }
        }
        if (themeData.schedule) {
          schedule.value = { ...themeData.schedule }
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

      if (!systemThemeListenerInitialized) {
        initSystemThemeListener()
        systemThemeListenerInitialized = true
      }
      if (!scheduleTimer) {
        scheduleTimer = setInterval(() => {
          scheduleTick.value += 1
          if (themeMode.value === 'system' && schedule.value.enabled) updateTheme()
        }, 60_000)
      }
      updateTheme()
    })()

    if (!uiConfig) {
      initThemePromise = promise
    }

    return promise
  }

  return {
    themeId,
    themeMode,
    primaryColor,
    backgroundImage,
    backgroundImagePath,
    backgroundOpacity,
    blurAmount,
    transparentBg,
    sidebarCollapsed,
    navigationMode,
    titlebarHidden,
    isDark,
    systemDark,
    appearance,
    schedule,
    naiveTheme,
    themeOverrides,
    colors,
    initSystemThemeListener,
    updateTheme,
    setThemeMode,
    setThemeId,
    setPrimaryColor,
    setAppearance,
    setSchedule,
    setBackgroundImage,
    setBlurAmount,
    setBackgroundOpacity,
    setTransparentBg,
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
    themeId,
    themeMode,
    primaryColor,
    backgroundImage,
    backgroundImagePath,
    backgroundOpacity,
    blurAmount,
    transparentBg,
    sidebarCollapsed,
    navigationMode,
    titlebarHidden,
    isDark,
    appearance,
    schedule,
    naiveTheme,
    themeOverrides,
    colors,
  } = storeToRefs(store)
  return {
    themeId: readonly(themeId),
    themeMode: readonly(themeMode),
    primaryColor: readonly(primaryColor),
    backgroundImage: readonly(backgroundImage),
    backgroundImagePath: readonly(backgroundImagePath),
    backgroundOpacity: readonly(backgroundOpacity),
    blurAmount: readonly(blurAmount),
    transparentBg: readonly(transparentBg),
    sidebarCollapsed: readonly(sidebarCollapsed),
    navigationMode: readonly(navigationMode),
    titlebarHidden: readonly(titlebarHidden),
    isDark: readonly(isDark),
    appearance: readonly(appearance),
    schedule: readonly(schedule),
    naiveTheme,
    themeOverrides,
    colors,
    setThemeMode: store.setThemeMode,
    setThemeId: store.setThemeId,
    setPrimaryColor: store.setPrimaryColor,
    setAppearance: store.setAppearance,
    setSchedule: store.setSchedule,
    setBackgroundImage: store.setBackgroundImage,
    setBlurAmount: store.setBlurAmount,
    setTransparentBg: store.setTransparentBg,
    setBackgroundOpacity: store.setBackgroundOpacity,
    setSidebarCollapsed: store.setSidebarCollapsed,
    setNavigationMode: store.setNavigationMode,
    setTitlebarHidden: store.setTitlebarHidden,
    toggleTheme: store.toggleTheme,
    initTheme,
    updateTheme: store.updateTheme,
  }
}
