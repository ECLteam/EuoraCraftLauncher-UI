// ============================================================
// 主题预设配置
// 预设色、主题模式选项、亮暗色板
// ============================================================

import type { ThemeMode } from '@/composables/useTheme'

// ---- 预设主题色 ----

export interface PresetColor {
  name: string
  value: string
}

export const PRESET_COLORS: PresetColor[] = [
  { name: '品牌蓝', value: '#4A7FD9' },
  { name: '天空蓝', value: '#5B9BD5' },
  { name: '薄荷绿', value: '#52A37F' },
  { name: '珊瑚橙', value: '#D4755B' },
  { name: '薰衣草', value: '#8B7FD9' },
  { name: '石墨灰', value: '#6A6D74' },
]

/** 默认主色 */
export const DEFAULT_PRIMARY_COLOR = '#4A7FD9'

// ---- 主题模式选项 ----

export interface ThemeModeOption {
  value: ThemeMode
  icon: string
}

export const THEME_MODE_OPTIONS: ThemeModeOption[] = [
  { value: 'light', icon: 'sun' },
  { value: 'dark', icon: 'moon' },
  { value: 'system', icon: 'settings' },
]

// ---- 亮色/暗色色板 ----

export interface ThemeColorPalette {
  success: string
  warning: string
  error: string
  info: string
  background: string
  backgroundHover: string
  surface: string
  text: string
  textSecondary: string
  border: string
}

export const LIGHT_THEME_COLORS: ThemeColorPalette = {
  success: '#52c41a',
  warning: '#faad14',
  error: '#E55C5C',
  info: '#4A7FD9',
  background: 'rgba(255,255,255,0.92)',
  backgroundHover: 'rgba(255,255,255,0.96)',
  surface: 'rgba(255,255,255,0.92)',
  text: '#1A1A1A',
  textSecondary: '#5C5C5C',
  border: 'rgba(0,0,0,0.06)',
}

export const DARK_THEME_COLORS: ThemeColorPalette = {
  success: '#52c41a',
  warning: '#faad14',
  error: '#E55C5C',
  info: '#4A7FD9',
  background: 'rgba(35,38,45,0.92)',
  backgroundHover: 'rgba(45,48,55,0.96)',
  surface: 'rgba(35,38,45,0.92)',
  text: '#E8E9EB',
  textSecondary: '#A0A3A8',
  border: 'rgba(255,255,255,0.08)',
}