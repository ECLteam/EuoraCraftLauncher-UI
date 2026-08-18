import { defineConfig } from 'vitest/config'
import { sharedAlias, sharedPlugins } from './vite.shared'

export default defineConfig({
  plugins: sharedPlugins,
  resolve: {
    alias: sharedAlias,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    clearMocks: true,
  },
})
