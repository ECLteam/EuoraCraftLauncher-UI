// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    Components()
  ],
  publicDir: 'public',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    host: false
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: 'chrome100',
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'naive-ui': ['naive-ui'],
          'gsap': ['gsap'],
          'vue-vendor': ['vue', 'vue-router'],
          'i18n': ['vue-i18n'],
          'icons': ['@iconify/vue']
        }
      }
    }
  }
})
