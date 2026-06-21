/// <reference lib="dom" />

interface TauriCore {
  pytauri: {
    pyInvoke: (command: string, payload?: any) => Promise<any>
  }
  /** 注册事件监听，返回 unlisten 函数 */
  listen: (event: string, handler: (event: { payload: any }) => void) => () => void
  /** 将本地文件路径转换为 asset protocol URL */
  convertFileSrc: (path: string) => string
  window?: {
    minimize: () => Promise<void>
    close: () => Promise<void>
    setPosition: (x: number, y: number) => Promise<void>
    [key: string]: any
  }
  [key: string]: any
}

interface Window {
  __TAURI__?: TauriCore
}

export {}
