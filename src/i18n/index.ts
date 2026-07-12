import { createI18n } from 'vue-i18n'
import backend from '@/api/client'
import enUS from './locales/en-US.json'
import zhCN from './locales/zh-CN.json'

interface TauriGlobal {
  __TAURI__?: {
    pytauri?: unknown
  }
}

// 支持的语言列表
export const supportedLocales = [
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' }
] as const

export type LocaleCode = typeof supportedLocales[number]['code']

export const defaultLocale: LocaleCode = 'zh-CN'

export const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: defaultLocale,
  missingWarn: import.meta.env.DEV,
  fallbackWarn: import.meta.env.DEV,
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

/**
 * 从后端配置加载并应用语言。
 * @returns 最终生效的语言代码
 */
export async function loadLocaleFromBackend(): Promise<LocaleCode> {
  try {
    if (typeof window !== 'undefined' && (window as unknown as TauriGlobal).__TAURI__?.pytauri) {
      const result = await backend.config.get('ui')
      if (result.success && result.data?.locale) {
        const locale = result.data.locale as LocaleCode
        if (supportedLocales.some(l => l.code === locale)) {
          i18n.global.locale.value = locale
          document.documentElement.setAttribute('lang', locale)
          return locale
        }
      }
    }
  } catch (error) {
    console.warn('[i18n] 从后端加载语言配置失败:', error)
  }
  return defaultLocale
}

/**
 * 切换前端语言并同步保存到后端。
 * @param locale - 目标语言代码
 */
export async function setLocale(locale: LocaleCode): Promise<void> {
  i18n.global.locale.value = locale
  document.documentElement.setAttribute('lang', locale)

  try {
    if (typeof window !== 'undefined' && (window as unknown as TauriGlobal).__TAURI__?.pytauri) {
      const ui = (await backend.config.get('ui')).data || {}
      await backend.config.set('ui', { ...ui, locale })
    }
  } catch (error) {
    console.warn('[i18n] 保存语言配置到后端失败:', error)
  }
}

/**
 * 获取当前生效的语言代码。
 */
export function getCurrentLocale(): LocaleCode {
  return i18n.global.locale.value as LocaleCode
}

export default i18n
