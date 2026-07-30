// ============================================================
// openExternalUrl — 统一外部链接打开
// 桌面模式：通过后端调用系统默认浏览器
// 其他模式：使用 window.open 降级
// ============================================================

import { backend } from '@/api/client'

/**
 * 使用系统默认浏览器打开外部 URL
 * 解决 Tauri WebView 内 <a target="_blank"> 点击无反应的问题
 * @param url 要打开的 URL
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (!url) return

  if (backend.runtime.isDesktop) {
    try {
      await backend.command('open_url', { url })
    } catch (err) {
      console.error('[openExternalUrl] 桌面模式打开失败，降级到 window.open:', err)
      window.open(url, '_blank', 'noopener')
    }
  } else {
    window.open(url, '_blank', 'noopener')
  }
}