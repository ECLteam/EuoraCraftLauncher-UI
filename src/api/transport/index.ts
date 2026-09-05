import { detectRuntimeMode, hasShowcaseQuery } from '@/app/runtime/mode'
import { createShowcaseTransport } from './showcase'
import { createTauriTransport } from './tauri'
import { createUnavailableTransport } from './unavailable'
import { createWsTransport, resolveWsConnection } from './ws'
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
  // 工具箱内嵌前端：宿主注入 Dev Channel 连接信息时，回落为真实后端的 WebSocket 传输层
  const wsConnection = resolveWsConnection()
  if (wsConnection) return createWsTransport(wsConnection)
  return createUnavailableTransport()
}

export type { BackendTransport } from './types'
