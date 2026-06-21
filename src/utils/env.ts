/**
 * 统一检测 Tauri / PyTauri 运行环境
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI__?.pytauri
}

/**
 * 安全获取 Tauri API 对象
 */
export function getTauriApi(): any | undefined {
  if (isTauri()) {
    return (window as any).__TAURI__
  }
  return undefined
}
