// vite.shared.ts — Vite 与 Vitest 共享的配置片段（路径别名与基础插件），
// 避免 vite.config.ts 与 vitest.config.ts 各自重复定义。
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'

/** 共享路径别名：`@` 指向 src，vue 使用完整构建版 */
export const sharedAlias = {
  '@': resolve(__dirname, './src'),
  vue: 'vue/dist/vue.esm-bundler.js',
}

/** 共享基础插件（Vue 单文件组件支持） */
export const sharedPlugins = [vue()]
