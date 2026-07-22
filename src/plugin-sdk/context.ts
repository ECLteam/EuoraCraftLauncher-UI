// 插件执行上下文，用于在脚本注入期间标识当前插件

import type { PluginSdkContext } from './types'

let activeContext: PluginSdkContext | null = null

export function setActiveContext(ctx: PluginSdkContext | null): void {
  activeContext = ctx
}

export function getActiveContext(): PluginSdkContext | null {
  return activeContext
}
