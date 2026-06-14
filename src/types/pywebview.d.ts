// src/types/pywebview.d.ts
// Tauri 全局类型声明

declare global {
  interface Window {
    __TAURI__?: {
      pytauri: {
        pyInvoke: (command: string, payload?: any) => Promise<any>
      }
      window: any
      [key: string]: any
    }
  }
}

export {}
