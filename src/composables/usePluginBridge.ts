import { ref } from 'vue'
import backend from '@/api/client'
import * as api from '@/plugin-sdk/api'
import * as component from '@/plugin-sdk/component'
import '@/plugin-sdk/styles/plugin-base.css'
import { setActiveContext } from '@/plugin-sdk/context'
import * as dom from '@/plugin-sdk/dom'
import { listen, unlisten, cleanup as cleanupEvents, once, Events } from '@/plugin-sdk/events'
import { createHooks, runPluginCleanup } from '@/plugin-sdk/hooks'
import * as router from '@/plugin-sdk/router'
import {
  initPluginState,
  getThemeState,
  getLauncherState,
  getAccountState,
  refreshTheme,
  refreshLauncher,
  refreshAccounts,
  watchTheme,
  watchLauncher,
  watchAccount,
} from '@/plugin-sdk/state'
import { getToken, watchToken, getMode, watchMode } from '@/plugin-sdk/theme'
import { transpileTS } from '@/plugin-sdk/transpile'
import * as ui from '@/plugin-sdk/ui'
import * as widgets from '@/plugin-sdk/widgets'
import type { PluginSdkContext } from '@/plugin-sdk/types'
import type { PluginRoute, PluginSlotItem } from '@/types/api'
import type { useRouter } from 'vue-router'

interface PluginSdkGlobal {
  __plugin_sdk__?: PluginSdkInstance
}

interface PluginSdkInstance {
  plugin: PluginSdkContext
  api: typeof api
  ui: typeof ui
  widgets: typeof widgets
  dom: typeof dom
  component: typeof component
  router: typeof router
  events: {
    listen: typeof listen
    unlisten: typeof unlisten
    once: typeof once
    cleanup: typeof cleanupEvents
    Events: typeof Events
  }
  state: {
    theme: ReturnType<typeof getThemeState>
    launcher: ReturnType<typeof getLauncherState>
    account: ReturnType<typeof getAccountState>
    watchTheme: typeof watchTheme
    watchLauncher: typeof watchLauncher
    watchAccount: typeof watchAccount
    refreshTheme: typeof refreshTheme
    refreshLauncher: typeof refreshLauncher
    refreshAccounts: typeof refreshAccounts
  }
  theme: {
    getToken: typeof getToken
    watchToken: typeof watchToken
    getMode: typeof getMode
    watchMode: typeof watchMode
  }
  hooks: ReturnType<typeof createHooks>
  transpileTS: typeof transpileTS
  createIframeBridge: typeof ui.createIframeBridge
  _reportError: (err: unknown) => void
}

const sdkCache = new Map<string, PluginSdkInstance>()

function reportPluginError(plugin: string, err: unknown): void {
  console.error(`[PluginBridge] 插件执行失败 [${plugin}]:`, err)
}

function createPluginSdk(pluginName: string, version = ''): PluginSdkInstance {
  const ctx: PluginSdkContext = { plugin: pluginName, version }
  return {
    plugin: ctx,
    api,
    ui,
    widgets,
    dom,
    component,
    router,
    events: { listen, unlisten, once, cleanup: cleanupEvents, Events },
    state: {
      theme: getThemeState(),
      launcher: getLauncherState(),
      account: getAccountState(),
      watchTheme,
      watchLauncher,
      watchAccount,
      refreshTheme,
      refreshLauncher,
      refreshAccounts,
    },
    theme: { getToken, watchToken, getMode, watchMode },
    hooks: createHooks(pluginName),
    transpileTS,
    createIframeBridge: ui.createIframeBridge,
    _reportError: (err) => reportPluginError(pluginName, err),
  }
}

function getPluginSdk(pluginName: string): PluginSdkInstance {
  let sdk = sdkCache.get(pluginName)
  if (!sdk) {
    sdk = createPluginSdk(pluginName)
    sdkCache.set(pluginName, sdk)
  }
  return sdk
}

;(window as unknown as PluginSdkGlobal).__plugin_sdk__ = createPluginSdk('__global__')

const pluginRoutes = ref<PluginRoute[]>([])
const pluginSlots = ref<Record<string, PluginSlotItem[]>>({})

// ── SlotRegistry ──

interface SlotEntry {
  plugin: string
  html: string
  priority: number
}

interface DynamicSlot {
  id: string
  plugin: string
  target: string
  position: 'before' | 'after' | 'prepend' | 'append'
  container: HTMLElement | null
}

const dynamicSlots = new Map<string, DynamicSlot>()

function sanitizeHtml(html: string): string {
  let result = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  result = result.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
  result = result.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '')
  result = result.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"')
  result = result.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src="#"')
  result = result.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
  result = result.replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, '')
  result = result.replace(/<embed\b[^>]*\/?>/gi, '')
  return result
}

function renderSlot(slot: string) {
  const el = document.getElementById(`plugin-slot-${slot}`)
  if (!el) return
  el.innerHTML = ''
  const entries = (pluginSlots.value[slot] || []).slice().sort((a, b) => {
    const aPriority = (a as unknown as SlotEntry).priority ?? 0
    const bPriority = (b as unknown as SlotEntry).priority ?? 0
    return bPriority - aPriority
  })
  for (const entry of entries) {
    const wrapper = document.createElement('div')
    wrapper.className = 'plugin-slot-item'
    wrapper.setAttribute('data-plugin', entry.plugin)
    wrapper.innerHTML = sanitizeHtml(entry.html)
    el.appendChild(wrapper)
  }
}

function createDynamicSlot(slotId: string, plugin: string, targetSelector: string, position: 'before' | 'after' | 'prepend' | 'append'): boolean {
  const target = document.querySelector(targetSelector)
  if (!target) return false

  const container = document.createElement('div')
  container.id = `plugin-slot-${slotId}`
  container.className = 'plugin-slot-container plugin-dynamic-slot'
  container.setAttribute('data-plugin', plugin)

  switch (position) {
    case 'before':
      target.parentElement?.insertBefore(container, target)
      break
    case 'after':
      target.parentElement?.insertBefore(container, target.nextSibling)
      break
    case 'prepend':
      target.insertBefore(container, target.firstChild)
      break
    case 'append':
    default:
      target.appendChild(container)
      break
  }

  dynamicSlots.set(slotId, {
    id: slotId,
    plugin,
    target: targetSelector,
    position,
    container,
  })

  return true
}

function removeDynamicSlot(slotId: string) {
  const slot = dynamicSlots.get(slotId)
  if (!slot) return
  if (slot.container) {
    slot.container.remove()
  }
  dynamicSlots.delete(slotId)
}

function clearSlotElements() {
  document.querySelectorAll('[id^="plugin-slot-"]').forEach(el => {
    const id = el.id.replace('plugin-slot-', '')
    if (!dynamicSlots.has(id)) {
      el.innerHTML = ''
    }
  })
}

function clearPluginSlots(pluginName: string) {
  for (const slot of Object.keys(pluginSlots.value)) {
    const entries = pluginSlots.value[slot] ?? []
    pluginSlots.value[slot] = entries.filter(e => e.plugin !== pluginName)
    if (pluginSlots.value[slot]?.length === 0) {
      delete pluginSlots.value[slot]
    }
    renderSlot(slot)
  }

  for (const [slotId, slot] of dynamicSlots) {
    if (slot.plugin === pluginName) {
      removeDynamicSlot(slotId)
    }
  }
}

const _injectedScripts = new Set<string>()

function wrapScript(plugin: string, script: string): string {
  return `
try {
  ${script}
} catch (__e) {
  if (window.__plugin_sdk__ && window.__plugin_sdk__._reportError) {
    window.__plugin_sdk__._reportError(__e)
  } else {
    console.error('[PluginBridge] 插件脚本执行失败 [${plugin}]:', __e)
  }
}
`
}

function executeScript(plugin: string, script: string) {
  const id = `plugin-script-${plugin}`
  const old = document.getElementById(id)
  if (old) old.remove()

  const sdk = getPluginSdk(plugin)
  setActiveContext({ plugin, version: '' })
  ;(window as unknown as PluginSdkGlobal).__plugin_sdk__ = sdk

  const el = document.createElement('script')
  el.id = id
  el.setAttribute('data-plugin', plugin)
  el.textContent = wrapScript(plugin, script)
  document.head.appendChild(el)
  _injectedScripts.add(plugin)

  setActiveContext(null)
}

function cleanupScripts() {
  document.querySelectorAll('script[data-plugin]').forEach(el => el.remove())
  _injectedScripts.clear()
}

function setupRoutes(router: ReturnType<typeof useRouter>) {
  const existing = router.getRoutes().filter(r => r.meta?.pluginRoute)
  for (const route of existing) {
    router.removeRoute(route.name!)
  }

  for (const route of pluginRoutes.value) {
    const pluginName = route.plugin
    const path = `/plugin/${pluginName}${route.path}`

    router.addRoute({
      path,
      name: `plugin-${pluginName}-${route.path}`,
      component: {
        template: `<div class="plugin-page" data-plugin="${pluginName}"><div id="plugin-slot-plugin-${pluginName}"></div></div>`,
        mounted() {
          setTimeout(() => renderSlot(`plugin-${pluginName}`), 50)
        },
      },
      meta: { pluginRoute: true, pluginName, title: route.title },
    })
  }
}

function cleanupPlugin(pluginName: string) {
  const scriptEl = document.getElementById(`plugin-script-${pluginName}`)
  if (scriptEl) scriptEl.remove()
  _injectedScripts.delete(pluginName)

  const styleEl = document.getElementById(`plugin-css-${pluginName}`)
  if (styleEl) styleEl.remove()

  document.querySelectorAll(`style[data-plugin="${pluginName}"]`).forEach(el => el.remove())
  document.querySelectorAll(`[data-plugin="${pluginName}"]`).forEach(el => {
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return
    if (el.id && el.id.startsWith('plugin-slot-')) return
    el.remove()
  })

  runPluginCleanup(pluginName)
}

function fullCleanupPlugin(pluginName: string) {
  cleanupPlugin(pluginName)
  clearPluginSlots(pluginName)
  sdkCache.delete(pluginName)
}

async function refreshRoutes(router: ReturnType<typeof useRouter>) {
  const res = await backend.command('plugin_get_routes')
  if (res?.success) {
    pluginRoutes.value = res.data || []
    setupRoutes(router)
  }
}

const unlistenFns: Array<() => void> = []
let cleanupState: (() => void) | null = null

export function initPluginBridge(router: ReturnType<typeof useRouter>) {
  cleanupState = initPluginState()

  unlistenFns.push(backend.on('plugin:html_injected', (payload) => {
    const slot = payload.slot
    const priority = payload.priority ?? 0
    const entries = pluginSlots.value[slot] || []
    entries.push({ plugin: payload.plugin, html: payload.html, priority } as unknown as PluginSlotItem)
    pluginSlots.value[slot] = entries
    renderSlot(slot)
  }))

  unlistenFns.push(backend.on('plugin:slot_registered', (payload) => {
    const { slot, plugin, target, position } = payload
    const ok = createDynamicSlot(slot, plugin, target, position || 'append')
    if (!ok) {
      console.warn(`[PluginBridge] 动态 slot 创建失败 [${slot}]: 目标 "${target}" 不存在`)
    }
  }))

  unlistenFns.push(backend.on('plugin:slot_unregistered', (payload) => {
    removeDynamicSlot(payload.slot)
  }))

  unlistenFns.push(backend.on('plugin:route_registered', () => refreshRoutes(router)))
  unlistenFns.push(backend.on('plugin:route_unregistered', () => refreshRoutes(router)))

  unlistenFns.push(backend.on('plugin:script_injected', (payload) => {
    executeScript(payload.plugin, payload.script)
  }))

  unlistenFns.push(backend.on('plugin:typescript_injected', (payload) => {
    try {
      const js = transpileTS(payload.script || '')
      executeScript(payload.plugin, js)
    } catch (e) {
      console.error(`[PluginBridge] TS 转译失败 [${payload.plugin}]:`, e)
    }
  }))

  unlistenFns.push(backend.on('plugin:disabled', (payload) => {
    if (payload.plugin) fullCleanupPlugin(payload.plugin)
  }))
  unlistenFns.push(backend.on('plugin:pre_unload', (payload) => {
    if (payload.name) fullCleanupPlugin(payload.name)
  }))
  unlistenFns.push(backend.on('plugin:cleanup', (payload) => {
    if (payload.name) fullCleanupPlugin(payload.name)
  }))
  unlistenFns.push(backend.on('plugin:slots_cleared', (payload) => {
    if (payload.plugin) clearPluginSlots(payload.plugin)
  }))

  backend.command('plugin_get_routes').then(res => {
    if (res?.success) {
      pluginRoutes.value = res.data || []
      setupRoutes(router)
    }
  }).catch(() => {})

  backend.command('plugin_get_slots').then(res => {
    if (res?.success && res.data) {
      pluginSlots.value = res.data
      for (const slot of Object.keys(res.data)) {
        renderSlot(slot)
      }
    }
  }).catch(() => {})
}

export function destroyPluginBridge() {
  for (const fn of unlistenFns) {
    try { fn() } catch { /* 清理时忽略错误 */ }
  }
  unlistenFns.length = 0
  cleanupScripts()
  clearSlotElements()
  for (const [slotId] of dynamicSlots) {
    removeDynamicSlot(slotId)
  }
  dynamicSlots.clear()
  for (const plugin of sdkCache.keys()) {
    runPluginCleanup(plugin)
  }
  sdkCache.clear()
  cleanupState?.()
  cleanupState = null
}

export function callPluginCommand(command: string, params?: Record<string, unknown>) {
  return backend.command('plugin_call_command', { command, params })
}

export { pluginRoutes, pluginSlots, renderSlot, cleanupScripts, clearSlotElements, clearPluginSlots, createDynamicSlot, removeDynamicSlot, dynamicSlots }
