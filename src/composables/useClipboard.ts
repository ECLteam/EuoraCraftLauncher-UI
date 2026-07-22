// 统一剪贴板写入

import { useClipboard as useVueuseClipboard } from '@vueuse/core'

export function useClipboard() {
  const { copied, copy } = useVueuseClipboard({ copiedDuring: 2000 })
  return { copied, copy }
}
