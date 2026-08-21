export type FrontendWindowType = 'main' | 'theme-studio' | 'plugin'

export interface FrontendWindowContext {
  type: FrontendWindowType
  label: string
  sessionId?: string
  route?: string
  title?: string
}

declare global {
  interface Window {
    __ECL_WINDOW_CONTEXT__?: Record<string, string>
  }
}

export function getWindowContext(): FrontendWindowContext {
  const query = new URLSearchParams(window.location.search)
  const injected = window.__ECL_WINDOW_CONTEXT__
  const value = (key: string) => injected?.[key] || query.get(key) || undefined
  const rawType = value('window')
  const type: FrontendWindowType = rawType === 'theme-studio' || rawType === 'plugin' ? rawType : 'main'
  return {
    type,
    label: value('label') || (type === 'main' ? 'main' : type),
    sessionId: value('session'),
    route: value('route'),
    title: value('title'),
  }
}

export const windowContext = getWindowContext()
