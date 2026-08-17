import backend from '@/api/client'
import { unwrapResponse } from '@/app/runtime/errorPresentation'
import type { TerminalLogEntry } from '@/types/api'

export const terminalApi = {
  getLogHistory(): Promise<TerminalLogEntry[]> {
    return backend.command('logs_get_history').then((response) => unwrapResponse(response, '读取日志历史').logs)
  },
}
