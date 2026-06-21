import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'
import backend from '@/api/client'

// 支持的语言列表
export const supportedLocales = [
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' }
] as const

export type LocaleCode = typeof supportedLocales[number]['code']

// 默认语言
export const defaultLocale: LocaleCode = 'zh-CN'

// 获取初始语言
function getInitialLocale(): LocaleCode {
  return defaultLocale
}

// 创建 i18n 实例
export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

// 从后端加载语言配置
export async function loadLocaleFromBackend(): Promise<LocaleCode> {
  try {
    // 检查 PyTauri 是否可用
    if (typeof window !== 'undefined' && (window as any).__TAURI__?.pytauri) {
      const result = await backend.config.get('ui')
      if (result.success && result.data?.locale) {
        const locale = result.data.locale as LocaleCode
        if (supportedLocales.some(l => l.code === locale)) {
          // 更新 i18n 语言
          i18n.global.locale.value = locale
          // 更新 HTML lang 属性
          document.documentElement.setAttribute('lang', locale)
          return locale
        }
      }
    }
  } catch (error) {
    console.warn('[i18n] 从后端加载语言配置失败:', error)
  }
  return getInitialLocale()
}

// 切换语言函数（同时更新后端和前端）
export async function setLocale(locale: LocaleCode): Promise<void> {
  // 更新前端
  i18n.global.locale.value = locale
  document.documentElement.setAttribute('lang', locale)
  
  // 尝试保存到后端
  try {
    if (typeof window !== 'undefined' && (window as any).__TAURI__?.pytauri) {
      const ui = (await backend.config.get('ui')).data || {}
      await backend.config.set('ui', { ...ui, locale })
    }
  } catch (error) {
    console.warn('[i18n] 保存语言配置到后端失败:', error)
  }
}

// 获取当前语言
export function getCurrentLocale(): LocaleCode {
  return i18n.global.locale.value as LocaleCode
}

export default i18n
