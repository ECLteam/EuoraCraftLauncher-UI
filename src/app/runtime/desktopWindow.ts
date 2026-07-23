interface TauriWindow {
  minimize: () => Promise<void>
  close: () => Promise<void>
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
}
