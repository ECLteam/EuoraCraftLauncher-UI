import { detectRuntimeMode, hasShowcaseQuery } from '@/app/runtime/mode'
import { createShowcaseTransport } from './showcase'
import { createTauriTransport } from './tauri'
import { createUnavailableTransport } from './unavailable'
import type { BackendTransport } from './types'

export function createBackendTransport(): BackendTransport {
  const mode = detectRuntimeMode()
  // Tauri 环境下的展示模式：使用 mock 数据但保持 desktop 模式以显示窗口控制按钮
  if (mode === 'desktop' && hasShowcaseQuery()) {
    const showcase = createShowcaseTransport()
    return { ...showcase, mode: 'desktop' }
  }
  if (mode === 'showcase') return createShowcaseTransport()
  if (mode === 'desktop') return createTauriTransport()
  return createUnavailableTransport()
}

export type { BackendTransport } from './types'
