import backend from '@/api/client'
import { unwrapResponse } from '@/app/runtime/errorPresentation'
import type { ProcessInstance, TerminalLogEntry } from '@/types/api'

export const terminalApi = {
  getLogHistory(): Promise<TerminalLogEntry[]> {
    return backend.command('logs_get_history').then((response) => unwrapResponse(response, '读取日志历史').logs)
  },
  getProcessInstances(): Promise<ProcessInstance[]> {
    return backend.command('process_instances').then((response) => unwrapResponse(response, '读取子进程实例').instances)
  },
  sendProcessInput(instanceId: string, data: string): Promise<boolean> {
    return backend
      .command('process_input', { instance_id: instanceId, data })
      .then((response) => unwrapResponse(response, '写入标准输入').sent)
  },
  stopProcess(instanceId: string, force = false): Promise<boolean> {
    return backend
      .command('process_stop', { instance_id: instanceId, force })
      .then((response) => unwrapResponse(response, '停止子进程').stopped)
  },
  /** 仅调试模式可用，供 DevTools 端到端自测；失败静默返回 false。 */
  async spawnDebugProcess(args: {
    name: string
    type: string
    args: string[]
    cwd?: string
    stdin?: boolean
  }): Promise<boolean> {
    try {
      await backend.command('debug_process_spawn', args)
      return true
    } catch {
      return false
    }
  },
}
