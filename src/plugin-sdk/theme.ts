// 主题 token 读取与监听

export function getToken(name: string, fallback = ''): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

export function watchToken(name: string, cb: (value: string) => void): () => void {
  let last = getToken(name)
  const observer = new MutationObserver(() => {
    const value = getToken(name)
    if (value !== last) {
      last = value
      cb(value)
    }
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'data-theme'] })
  return () => observer.disconnect()
}

export function getMode(): 'light' | 'dark' {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

export function watchMode(cb: (mode: 'light' | 'dark') => void): () => void {
  let last = getMode()
  const observer = new MutationObserver(() => {
    const mode = getMode()
    if (mode !== last) {
      last = mode
      cb(mode)
    }
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}
