// vite.config.ts
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import Components from 'unplugin-vue-components/vite'

const packageVersion = (
  JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8')) as {
    version?: string
  }
).version

export default defineConfig({
  base: './',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageVersion ?? ''),
  },
  plugins: [vue(), Components()],
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
})
