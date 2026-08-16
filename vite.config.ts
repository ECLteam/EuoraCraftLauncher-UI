// vite.config.ts
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import checker from 'vite-plugin-checker'
import inspect from 'vite-plugin-inspect'
import Components from 'unplugin-vue-components/vite'

const packageVersion = (
  JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8')) as {
    version?: string
  }
).version

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  return {
    base: './',
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageVersion ?? ''),
    },
    plugins: [
      vue(),
      // 自动导入 Vue / Router / Pinia / i18n / VueUse 的组合式 API，避免重复手写 import
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia', 'vue-i18n', '@vueuse/core'],
        dts: resolve(__dirname, 'src/auto-imports.d.ts'),
      }),
      ...(isDev ? [vueDevTools()] : []),
      Components(),
      // 仅开发模式：在浏览器内实时提示 TS / ESLint 错误，避免切终端看报错
      ...(isDev
        ? [
            checker({
              vueTsc: { tsconfigPath: './tsconfig.app.json' },
              eslint: { lintCommand: 'eslint "./src/**/*.{ts,vue}"' },
            }),
          ]
        : []),
      // 仅开发模式：可视化检查各 Vite 插件产物，便于排查 import / 转换问题
      ...(isDev ? [inspect()] : []),
    ],
    publicDir: 'public',
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        vue: 'vue/dist/vue.esm-bundler.js',
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      host: false,
    },
    envPrefix: ['VITE_', 'TAURI_'],
    build: {
      target: 'chrome100',
      cssMinify: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'naive-ui': ['naive-ui'],
            gsap: ['gsap'],
            'vue-vendor': ['vue', 'vue-router'],
            i18n: ['vue-i18n'],
            'tabler-icons': ['@iconify-json/tabler', '@iconify/vue'],
          },
        },
      },
    },
  }
})
