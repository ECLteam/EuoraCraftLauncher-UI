import { createPinia } from 'pinia'

/**
 * 应用唯一的 Pinia 实例。
 *
 * 领域 Store 统一挂载在这里，避免各页面自行创建跨页面单例。
 */
export const pinia = createPinia()
