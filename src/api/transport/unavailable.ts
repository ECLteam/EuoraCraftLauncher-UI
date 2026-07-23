import type { BackendTransport } from './types'

export function createUnavailableTransport(): BackendTransport {
  return {
    mode: 'browser',
    available: false,
    async invoke() {
      throw new Error('当前为普通浏览器模式；请使用 pnpm showcase 启动脱离 IPC 的展示模式')
    },
    async listen() {
      return () => {}
    },
    convertFileSrc() {
      return null
    },
  }
}
