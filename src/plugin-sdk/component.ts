/**
 * plugin-sdk 组件定义与挂载系统
 * 让插件能够定义带响应式数据的简单组件，并挂载到任意 slot 位置。
 * 基于原生 Web API 实现，不依赖 Vue 运行时。
 */

import { getActiveContext } from './context'
import { querySelector } from './dom'

// ── 类型 ──

export interface ComponentOptions<S extends Record<string, unknown>> {
  state?: S
  template: (state: S, ctx: ComponentContext<S>) => string
  onMounted?: (ctx: ComponentContext<S>) => void
  onUnmounted?: (ctx: ComponentContext<S>) => void
  onUpdate?: (ctx: ComponentContext<S>, prevState: S) => void
  style?: string
}

export interface ComponentContext<S extends Record<string, unknown>> {
  state: S
  el: HTMLElement | null
  setState: (partial: Partial<S>) => void
  forceUpdate: () => void
  query: (selector: string) => Element | null
  queryAll: (selector: string) => Element[]
  on: (event: string, selector: string, handler: (e: Event, target: Element) => void) => () => void
}

export interface ComponentInstance<S extends Record<string, unknown>> {
  ctx: ComponentContext<S>
  mount: (target: string | Element) => void
  unmount: () => void
  update: (partial: Partial<S>) => void
}

// ── 组件创建 ──

export function defineComponent<S extends Record<string, unknown>>(
  options: ComponentOptions<S>
): ComponentInstance<S> {
  let el: HTMLElement | null = null
  let mounted = false
  let cleanupFns: (() => void)[] = []
  const initial = (options.state || {}) as S

  function render() {
    if (!el) return
    el.innerHTML = options.template(ctx.state, ctx)
    if (options.style) {
      let styleEl = el.querySelector('style[data-component-style]')
      if (!styleEl) {
        styleEl = document.createElement('style')
        styleEl.setAttribute('data-component-style', '1')
        el.prepend(styleEl)
      }
      styleEl.textContent = options.style
    }
  }

  const ctx: ComponentContext<S> = {
    state: { ...initial },
    get el() { return el },
    setState(partial: Partial<S>) {
      const prev = { ...ctx.state }
      Object.assign(ctx.state, partial)
      render()
      if (mounted) options.onUpdate?.(ctx, prev)
    },
    forceUpdate() {
      render()
    },
    query(selector: string) {
      return el ? el.querySelector(selector) : null
    },
    queryAll(selector: string) {
      return el ? Array.from(el.querySelectorAll(selector)) : []
    },
    on(event: string, selector: string, handler: (e: Event, target: Element) => void) {
      const listener = (e: Event) => {
        const target = (e.target as Element).closest(selector)
        if (target && el && el.contains(target)) {
          handler(e, target)
        }
      }
      if (el) el.addEventListener(event, listener)
      const cleanup = () => { if (el) el.removeEventListener(event, listener) }
      cleanupFns.push(cleanup)
      return cleanup
    },
  }

  function mount(target: string | Element) {
    const t = typeof target === 'string' ? querySelector(target) : target
    if (!t) throw new Error(`[PluginSDK] 组件挂载目标不存在: ${target}`)
    const plugin = getActiveContext()?.plugin || 'unknown'
    el = document.createElement('div')
    el.className = 'plugin-component'
    el.setAttribute('data-plugin', plugin)
    render()
    t.appendChild(el)
    mounted = true
    options.onMounted?.(ctx)
  }

  function unmount() {
    if (!mounted) return
    mounted = false
    options.onUnmounted?.(ctx)
    for (const fn of cleanupFns) {
      try { fn() } catch { /* ignore */ }
    }
    cleanupFns = []
    if (el) {
      el.remove()
      el = null
    }
  }

  function update(partial: Partial<S>) {
    ctx.setState(partial)
  }

  return { ctx, mount, unmount, update }
}

// ── 列表组件 ──

export interface ListComponentOptions<T> {
  container: (ctx: ComponentContext<{ items: T[] }>) => string
  item: (item: T, index: number, ctx: ComponentContext<{ items: T[] }>) => string
  empty?: (ctx: ComponentContext<{ items: T[] }>) => string
  key?: (item: T, index: number) => string
  onItemClick?: (item: T, index: number, e: Event) => void
  style?: string
}

export function defineListComponent<T>(
  options: ListComponentOptions<T>
): ComponentInstance<{ items: T[] }> {
  return defineComponent<{ items: T[] }>({
    state: { items: [] },
    template(state, ctx) {
      const containerHtml = options.container(ctx)
      const placeholder = '<!-- list-items -->'
      const itemsHtml = state.items.length > 0
        ? state.items.map((item, i) => options.item(item, i, ctx)).join('')
        : (options.empty ? options.empty(ctx) : '')

      return containerHtml.replace(placeholder, itemsHtml)
    },
    style: options.style,
    onMounted(ctx) {
      if (options.onItemClick && ctx.el) {
        ctx.el.addEventListener('click', (e) => {
          const target = (e.target as Element).closest('[data-list-index]')
          if (target) {
            const idx = parseInt(target.getAttribute('data-list-index') || '-1', 10)
            const item = ctx.state.items[idx]
            if (idx >= 0 && item !== undefined) {
              options.onItemClick?.(item, idx, e)
            }
          }
        })
      }
    },
  })
}

// ── 响应式绑定 ──

export function bindInput(
  ctx: ComponentContext<Record<string, unknown>>,
  key: string,
  selector: string
): () => void {
  const el = ctx.query(selector)
  if (!el || !(el instanceof HTMLInputElement)) return () => {}

  const handler = () => {
    const input = el as HTMLInputElement
    const value = input.type === 'checkbox' ? input.checked : input.value
    ctx.setState({ [key]: value } as Partial<Record<string, unknown>>)
  }

  el.addEventListener('input', handler)
  el.addEventListener('change', handler)

  return () => {
    el.removeEventListener('input', handler)
    el.removeEventListener('change', handler)
  }
}
