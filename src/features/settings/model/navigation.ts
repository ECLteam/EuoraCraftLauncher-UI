import type { NavigationMode, ThemeConfig } from '@/types/config'

/**
 * 读取新版导航模式，同时兼容旧配置中的 titlebar_hidden。
 */
export function resolveNavigationMode(theme?: Partial<ThemeConfig> | null): NavigationMode {
  if (theme?.navigation_mode === 'sidebar' || theme?.navigation_mode === 'top') {
    return theme.navigation_mode
  }

  if (typeof theme?.titlebar_hidden === 'boolean') {
    return theme.titlebar_hidden ? 'sidebar' : 'top'
  }

  return 'sidebar'
}
