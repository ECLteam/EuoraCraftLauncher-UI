import { detectRuntimeMode } from '@/app/runtime/mode'
import { createShowcaseTransport } from './showcase'
import { createTauriTransport } from './tauri'
import { createUnavailableTransport } from './unavailable'
import type { BackendTransport } from './types'

export function createBackendTransport(): BackendTransport {
  const mode = detectRuntimeMode()
  if (mode === 'showcase') return createShowcaseTransport()
  if (mode === 'desktop') return createTauriTransport()
  return createUnavailableTransport()
}

export type { BackendTransport } from './types'
