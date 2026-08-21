import type { ThemeMode } from '@/composables/useTheme'

export interface PresetColor {
  name: string
  value: string
}

export const PRESET_COLORS: PresetColor[] = [
  { name: 'ECL 蓝', value: '#5B6FF5' },
  { name: '天空蓝', value: '#5B9BD5' },
  { name: '薄荷绿', value: '#52A37F' },
  { name: '珊瑚橙', value: '#D4755B' },
  { name: '薰衣草', value: '#8B7FD9' },
  { name: '石墨灰', value: '#6A6D74' },
]

export const DEFAULT_PRIMARY_COLOR = '#5B6FF5'

export interface ThemeModeOption {
  value: ThemeMode
  icon: string
}

export const THEME_MODE_OPTIONS: ThemeModeOption[] = [
  { value: 'light', icon: 'sun' },
  { value: 'dark', icon: 'moon' },
  { value: 'system', icon: 'settings' },
]

export interface ThemeColorPalette {
  success: string
  warning: string
  error: string
  info: string
  background: string
  backgroundHover: string
  surface: string
  cardBackground: string
  text: string
  textSecondary: string
  border: string
}

export const LIGHT_THEME_COLORS: ThemeColorPalette = {
  success: '#3E9B70',
  warning: '#D99532',
  error: '#D95763',
  info: '#5B6FF5',
  background: 'rgba(255,255,255,0.62)',
  backgroundHover: 'rgba(240,243,248,0.7)',
  surface: 'rgba(255,255,255,0.6)',
  cardBackground: 'rgba(255,255,255,0.6)',
  text: '#1D2433',
  textSecondary: '#596275',
  border: 'rgba(29,36,51,0.12)',
}

export const DARK_THEME_COLORS: ThemeColorPalette = {
  success: '#58B98A',
  warning: '#E5AA51',
  error: '#EB6B76',
  info: '#8291FF',
  background: 'rgba(32,36,46,0.62)',
  backgroundHover: 'rgba(45,50,62,0.7)',
  surface: 'rgba(34,38,48,0.6)',
  cardBackground: 'rgba(34,38,48,0.6)',
  text: '#F1F3F7',
  textSecondary: '#B4BBC9',
  border: 'rgba(255,255,255,0.12)',
}
