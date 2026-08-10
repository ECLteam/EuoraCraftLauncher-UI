interface TauriWindow {
  minimize: () => Promise<void>
  close: () => Promise<void>
  startDragging: () => Promise<void>
}

function getCurrentWindow(): TauriWindow | null {
  if (typeof window === 'undefined') return null
  return (
    (
      window as unknown as {
        __TAURI__?: {
          window?: {
            getCurrentWindow?: () => TauriWindow
          }
        }
      }
    ).__TAURI__?.window?.getCurrentWindow?.() ?? null
  )
}

export const desktopWindow = {
  async minimize(): Promise<void> {
    await getCurrentWindow()?.minimize()
  },
  async close(): Promise<void> {
    await getCurrentWindow()?.close()
  },
  /** 通过 Tauri 原生 API 启动窗口拖拽，绕过 CSS -webkit-app-region 在 Linux/macOS 上的兼容性问题 */
  async startDragging(): Promise<void> {
    await getCurrentWindow()?.startDragging()
  },
}
