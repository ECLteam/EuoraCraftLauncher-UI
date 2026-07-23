import type { AppRuntimeMode } from '@/app/runtime/mode'

export interface BackendTransport {
  readonly mode: AppRuntimeMode
  readonly available: boolean
  invoke(command: string, payload?: unknown): Promise<unknown>
  listen<T>(event: string, handler: (payload: T) => void): Promise<() => void>
  convertFileSrc(path: string): string | null
}
