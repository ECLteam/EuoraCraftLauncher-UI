/// <reference lib="dom" />

interface TauriCore {
  pytauri: {
    pyInvoke: (command: string, payload?: unknown) => Promise<unknown>
  }
  /** 注册事件监听，返回 Promise<unlisten 函数> */
  listen: (event: string, handler: (event: { payload: unknown }) => void) => Promise<() => void>
  /** 将本地文件路径转换为 asset protocol URL */
  convertFileSrc: (path: string) => string
  window?: {
    minimize: () => Promise<void>
    close: () => Promise<void>
    setPosition: (x: number, y: number) => Promise<void>
  }
}

interface Window {
  __TAURI__?: TauriCore
}

export {}
