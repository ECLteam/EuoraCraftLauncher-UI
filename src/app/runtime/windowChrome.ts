import { readonly, ref } from 'vue'
import { desktopWindow } from './desktopWindow'

export type ActiveWindowChrome = 'custom' | 'native'

const activeWindowChrome = ref<ActiveWindowChrome>('custom')

/** 在首次渲染前读取主窗口的实际装饰状态，避免待重启设置提前改变当前布局。 */
export async function detectActiveWindowChrome(): Promise<void> {
  try {
    activeWindowChrome.value = (await desktopWindow.isDecorated()) ? 'native' : 'custom'
  } catch {
    activeWindowChrome.value = 'custom'
  }
}

export function useActiveWindowChrome() {
  return readonly(activeWindowChrome)
}
