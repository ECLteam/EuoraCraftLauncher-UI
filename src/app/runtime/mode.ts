export type AppRuntimeMode = 'desktop' | 'showcase' | 'browser'

function hasTauriRuntime(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as unknown as { __TAURI__?: { pytauri?: unknown } }).__TAURI__?.pytauri
}

function hasShowcaseQuery(): boolean {
  if (typeof window === 'undefined') return false
  const value = new URLSearchParams(window.location.search).get('showcase')
  return value === '1' || value === 'true'
}

export function detectRuntimeMode(): AppRuntimeMode {
  if (import.meta.env.MODE === 'showcase' || hasShowcaseQuery()) return 'showcase'
  if (hasTauriRuntime()) return 'desktop'
  return 'browser'
}
