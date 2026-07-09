import { ref, readonly, type App } from 'vue'
import { useRouter } from 'vue-router'
import backend from '@/api/client'
import { transpileTS } from '@/plugin-sdk/transpile'
import { createIframeBridge, showToast, showConfirm, showLoading } from '@/plugin-sdk/ui'
import { listen, Events } from '@/plugin-sdk/events'

// 暴露 plugin-sdk 到全局作用域，供插件注入的脚本使用
;(window as any).__plugin_sdk__ = {
  createIframeBridge,
  showToast,
  showConfirm,
  showLoading,
  listen,
  Events,
  transpileTS,
}

// ── 响应式状态 ──

const pluginRoutes = ref<any[]>([])
const pluginSlots = ref<Record<string, any[]>>({})
const pluginCommands = ref<any[]>([])

// ── HTML 插槽 DOM 管理 ──

function sanitizeHtml(html: string): string {
  // 移除 <script> 标签
  let result = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  // 移除内联事件处理器 (onerror, onclick, onload 等)
  result = result.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
  result = result.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '')
  // 移除 javascript: 协议
  result = result.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"')
  result = result.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src="#"')
  // 移除危险标签
  result = result.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
  result = result.replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, '')
  result = result.replace(/<embed\b[^>]*\/?>/gi, '')
  return result
}

function renderSlot(slot: string) {
  const el = document.getElementById(`plugin-slot-${slot}`)
  if (!el) return
  el.innerHTML = ''
  const entries = pluginSlots.value[slot] || []
  for (const entry of entries) {
    const wrapper = document.createElement('div')
    wrapper.className = 'plugin-slot-item'
    wrapper.setAttribute('data-plugin', entry.plugin)
    wrapper.innerHTML = sanitizeHtml(entry.html)
    el.appendChild(wrapper)
  }
}

function clearSlotElements() {
  document.querySelectorAll('[id^="plugin-slot-"]').forEach(el => {
    el.innerHTML = ''
  })
}

function clearPluginSlots(pluginName: string) {
  for (const slot of Object.keys(pluginSlots.value)) {
    pluginSlots.value[slot] = pluginSlots.value[slot].filter(e => e.plugin !== pluginName)
    if (pluginSlots.value[slot].length === 0) {
      delete pluginSlots.value[slot]
    }
    renderSlot(slot)
  }
}

// ── 脚本注入 ──
// 安全警告：此功能允许插件向前端注入并执行任意 JavaScript 代码。
// 注入的脚本拥有完整的前端权限，仅应信任经过验证的插件来源。

const _injectedScripts = new Set<string>()

function executeScript(plugin: string, script: string) {
  const id = `plugin-script-${plugin}`
  // 删除旧脚本
  const old = document.getElementById(id)
  if (old) old.remove()

  const el = document.createElement('script')
  el.id = id
  el.setAttribute('data-plugin', plugin)
  el.textContent = script
  document.head.appendChild(el)
  _injectedScripts.add(plugin)
}

function cleanupScripts() {
  document.querySelectorAll('script[data-plugin]').forEach(el => el.remove())
  _injectedScripts.clear()
}

// ── 路由注册 ──

function setupRoutes(router: ReturnType<typeof useRouter>) {
  // 清理旧路由
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
          // 路由加载后触发渲染插槽内容
          setTimeout(() => renderSlot(`plugin-${pluginName}`), 50)
        },
      },
      meta: { pluginRoute: true, pluginName, title: route.title },
    })
  }
}

// ── 清理（插件卸载时） ──

function cleanupPlugin(pluginName: string) {
  // 清理脚本
  const scriptEl = document.getElementById(`plugin-script-${pluginName}`)
  if (scriptEl) scriptEl.remove()
  _injectedScripts.delete(pluginName)

  // 清理 CSS
  const styleEl = document.getElementById(`plugin-css-${pluginName}`)
  if (styleEl) styleEl.remove()
}

function fullCleanupPlugin(pluginName: string) {
  cleanupPlugin(pluginName)
  clearPluginSlots(pluginName)
}

async function refreshRoutes(router: ReturnType<typeof useRouter>) {
  const res = await backend.command('plugin_get_routes')
  if (res?.success) {
    pluginRoutes.value = res.data || []
    setupRoutes(router)
  }
}

// ── 监听器清理 ──

const unlistenFns: Array<() => void> = []

// ── 初始化（App 启动时调用） ──

export function initPluginBridge(app: App, router: ReturnType<typeof useRouter>) {
  // 监听 HTML 注入
  unlistenFns.push(backend.on('plugin:html_injected', (payload: any) => {
    const slot = payload?.slot
    const entries = pluginSlots.value[slot] || []
    entries.push({ plugin: payload?.plugin, html: payload?.html })
    pluginSlots.value[slot] = entries
    renderSlot(slot)
  }))

  // 监听路由注册
  unlistenFns.push(backend.on('plugin:route_registered', () => refreshRoutes(router)))

  // 监听路由注销
  unlistenFns.push(backend.on('plugin:route_unregistered', () => refreshRoutes(router)))

  // 监听脚本注入
  unlistenFns.push(backend.on('plugin:script_injected', (payload: any) => {
    executeScript(payload?.plugin, payload?.script)
  }))

  // 监听 TypeScript 注入（自动转译后执行）
  unlistenFns.push(backend.on('plugin:typescript_injected', (payload: any) => {
    try {
      const js = transpileTS(payload?.script || '')
      executeScript(payload?.plugin, js)
    } catch (e) {
      console.error(`[PluginBridge] TS 转译失败 [${payload?.plugin}]:`, e)
    }
  }))

  // 监听插件卸载/禁用，清理残留
  unlistenFns.push(backend.on('plugin:disabled', (payload: any) => {
    if (payload?.plugin) fullCleanupPlugin(payload.plugin)
  }))
  unlistenFns.push(backend.on('plugin:pre_unload', (payload: any) => {
    if (payload?.name) fullCleanupPlugin(payload.name)
  }))

  // 监听插件重载清理（卸载前先清理前端残留）
  unlistenFns.push(backend.on('plugin:cleanup', (payload: any) => {
    if (payload?.name) fullCleanupPlugin(payload.name)
  }))

  // 监听插件 slots 清除（后端 clear_plugin_slots 触发）
  unlistenFns.push(backend.on('plugin:slots_cleared', (payload: any) => {
    if (payload?.plugin) clearPluginSlots(payload.plugin)
  }))

  // 初始加载已注册的路由和插槽
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

// ── 销毁（App 卸载时调用，清理所有监听器） ──

export function destroyPluginBridge() {
  for (const fn of unlistenFns) {
    try { fn() } catch {}
  }
  unlistenFns.length = 0
  cleanupScripts()
}

// ── 暴露响应式状态和命令调用 ──

export function callPluginCommand(command: string, params?: Record<string, unknown>) {
  return backend.command('plugin_call_command', { command, params })
}

export { pluginRoutes, pluginSlots, pluginCommands, renderSlot, cleanupScripts, clearSlotElements, clearPluginSlots }
