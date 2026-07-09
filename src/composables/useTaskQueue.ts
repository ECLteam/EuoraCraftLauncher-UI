import { ref, readonly, computed } from 'vue'

export interface Subtask {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'error'
  message: string
}

export interface TaskItem {
  id: string
  type: 'install' | 'download'
  name: string
  status: 'pending' | 'running' | 'completed' | 'error' | 'canceled'
  progress: number
  message: string
  subtasks: Subtask[]
  expanded: boolean
  timestamp: number
  versionId: string
  loaderType: string
}

const tasks = ref<TaskItem[]>([])
const panelVisible = ref(false)

let _taskIdCounter = 0

function generateTaskId(): string {
  _taskIdCounter++
  return `task_${Date.now()}_${_taskIdCounter}`
}

const activeCount = computed(() => tasks.value.filter(t => t.status === 'running' || t.status === 'pending').length)
const hasActiveTasks = computed(() => activeCount.value > 0)

export function useTaskQueue() {
  function addTask(task: Omit<TaskItem, 'id' | 'timestamp' | 'subtasks' | 'expanded' | 'progress' | 'message' | 'status'>): string {
    const id = generateTaskId()
    const item: TaskItem = {
      ...task,
      id,
      timestamp: Date.now(),
      subtasks: [],
      expanded: false,
      progress: 0,
      message: '准备中...',
      status: 'pending',
    }
    tasks.value.unshift(item)
    return id
  }

  function updateTask(taskId: string, updates: Partial<Pick<TaskItem, 'status' | 'progress' | 'message' | 'subtasks'>>) {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return
    if (updates.status !== undefined) task.status = updates.status
    if (updates.progress !== undefined) task.progress = Math.min(100, Math.max(0, updates.progress))
    if (updates.message !== undefined) task.message = updates.message
    if (updates.subtasks !== undefined) task.subtasks = updates.subtasks
  }

  function addSubtask(taskId: string, subtask: Subtask) {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return
    const existing = task.subtasks.find(s => s.id === subtask.id)
    if (existing) {
      existing.status = subtask.status
      existing.message = subtask.message
    } else {
      task.subtasks.push(subtask)
    }
  }

  function removeTask(taskId: string) {
    const idx = tasks.value.findIndex(t => t.id === taskId)
    if (idx !== -1) tasks.value.splice(idx, 1)
  }

  function clearCompleted() {
    tasks.value = tasks.value.filter(t => t.status === 'running' || t.status === 'pending')
  }

  function togglePanel() {
    panelVisible.value = !panelVisible.value
  }

  function openPanel() {
    panelVisible.value = true
  }

  function closePanel() {
    panelVisible.value = false
  }

  return {
    tasks: readonly(tasks),
    panelVisible,
    activeCount,
    hasActiveTasks,
    addTask,
    updateTask,
    addSubtask,
    removeTask,
    clearCompleted,
    togglePanel,
    openPanel,
    closePanel,
    generateTaskId,
  }
}

export const globalTaskQueue = useTaskQueue()