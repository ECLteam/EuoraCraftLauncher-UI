import { computed, ref } from 'vue'
import backend from '@/api/client'
import type { ProcessInstance, ProcessLogEntry } from '@/types/system'
import { terminalApi } from '../api/terminalApi'

/** 单实例输出环形缓冲上限，与全局日志 MAX_LINES 保持一致 */
const INSTANCE_LINE_LIMIT = 300

/** 后端登记的子进程实例列表（仅存活实例，退出即移除） */
const instances = ref<ProcessInstance[]>([])
/** 每实例实时输出缓冲，实例退出后保留选中实例直到切换，避免过早丢历史 */
const outputs = ref<Record<string, string[]>>({})
/** 当前选中的实例标识 */
const selectedId = ref<string | null>(null)
/** 正在从后端拉取实例快照 */
const loading = ref(false)

/**
 * 子进程实例终端状态控制器。
 *
 * 与悬浮窗组件同生命周期在 App 根部实例化：订阅 ``process:instance_log``
 * 与 ``process:instances_changed`` 事件维护实例列表与输出缓冲，供实例视图驱动。
 *
 * @return: 实例列表、选中态、输出与动作集合
 */
export function useProcessInstances() {
  function trim(lines: string[]): void {
    if (lines.length > INSTANCE_LINE_LIMIT) lines.splice(0, lines.length - INSTANCE_LINE_LIMIT)
  }

  function onLog(entry: ProcessLogEntry): void {
    if (!outputs.value[entry.instanceId]) outputs.value[entry.instanceId] = []
    const lines = outputs.value[entry.instanceId]!
    lines.push(entry.line)
    trim(lines)
  }

  function syncList(list: ProcessInstance[]): void {
    const incoming = new Set(list.map((item) => item.id))
    instances.value = list
    for (const item of list) {
      if (!outputs.value[item.id]) outputs.value[item.id] = item.lines ? [...item.lines] : []
    }
    // 回收已退出且非选中的实例输出，避免无界增长
    for (const id of Object.keys(outputs.value)) {
      if (!incoming.has(id) && id !== selectedId.value) delete outputs.value[id]
    }
    if (selectedId.value && !incoming.has(selectedId.value)) selectedId.value = null
  }

  async function refresh(): Promise<void> {
    loading.value = true
    try {
      const list = await terminalApi.getProcessInstances()
      syncList(list)
      if (!selectedId.value && list.length > 0) selectedId.value = list[0]!.id
    } finally {
      loading.value = false
    }
  }

  function select(id: string): void {
    selectedId.value = id
  }

  function active() {
    return instances.value.find((item) => item.id === selectedId.value) ?? null
  }

  const selectedOutput = computed<string[]>(() => {
    if (!selectedId.value) return []
    return outputs.value[selectedId.value] ?? []
  })

  async function sendInput(text: string): Promise<boolean> {
    const instance = active()
    if (!instance || !instance.stdin || !instance.running) return false
    return terminalApi.sendProcessInput(instance.id, text)
  }

  async function stop(id: string, force = false): Promise<void> {
    await terminalApi.stopProcess(id, force)
  }

  let offLog: (() => void) | null = null
  let offChanged: (() => void) | null = null

  /** 订阅实例事件并拉取首帧快照，由宿主组件在 onMounted 调用 */
  function init(): void {
    offLog?.()
    offChanged?.()
    offLog = backend.on('process:instance_log', onLog)
    offChanged = backend.on('process:instances_changed', (list) => syncList(list))
    void refresh()
  }

  /** 解除事件订阅并清理内部状态，由宿主组件在 onUnmounted 调用 */
  function dispose(): void {
    offLog?.()
    offChanged?.()
    offLog = null
    offChanged = null
  }

  return {
    instances,
    outputs,
    selectedId,
    loading,
    selectedOutput,
    onLog,
    syncList,
    refresh,
    select,
    active,
    sendInput,
    stop,
    init,
    dispose,
  }
}

/** 悬浮窗根部实例的模块级单例 */
export const globalProcessInstances = useProcessInstances()
