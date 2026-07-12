// 统一剪贴板写入

import { ref } from 'vue'

export function useClipboard() {
  const copied = ref(false)
  let resetTimer: ReturnType<typeof setTimeout> | null = null

  async function copy(text: string, resetDelay = 2000): Promise<boolean> {
    if (!navigator.clipboard) return false
    try {
      await navigator.clipboard.writeText(text)
      copied.value = true
      if (resetTimer) clearTimeout(resetTimer)
      resetTimer = setTimeout(() => { copied.value = false }, resetDelay)
      return true
    } catch {
      return false
    }
  }

  return { copied, copy }
}
