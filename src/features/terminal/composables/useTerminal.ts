import { computed, reactive, ref } from 'vue'
import type { TerminalLogEntry } from '@/types/api'

/** 悬浮窗三态：minimized 圆形按钮、floating 可拖动窗口、maximized 全屏 */
export type TerminalMode = 'minimized' | 'floating' | 'maximized'

/** 日志级别，入参后端标准化后的 levelname */
export type TerminalLogLevel = TerminalLogEntry['level']

/** 日志环形缓冲上限，超出后丢弃最旧行以避免内存无限增长 */
const MAX_LINES = 2000

/** 当前悬浮窗形态 */
export const terminalMode = ref<TerminalMode>('minimized')
/** 已收到的全部日志行（环形，最新在末尾） */
export const terminalLogs = ref<TerminalLogEntry[]>([])
/** 最小化期间累计的新日志条数，用于圆形按钮角标提示 */
export const terminalUnread = ref(0)
/** 新日志到达时是否自动滚动到底部 */
export const terminalAutoScroll = ref(true)
/** 关键词过滤，匹配消息/模块/文件名/级别（大小写不敏感） */
export const terminalQuery = ref('')

export const TERMINAL_LEVELS: readonly TerminalLogLevel[] = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']

/** 各级别是否展示，默认隐藏 DEBUG 以避免刷屏 */
export const terminalLevelsVisible = reactive<Record<TerminalLogLevel, boolean>>({
  DEBUG: false,
  INFO: true,
  WARNING: true,
  ERROR: true,
  CRITICAL: true,
})

/**
 * 依据级别过滤与关键词过滤筛选出的日志行。
 *
 * :return: 满足当前过滤条件的日志行列表
 */
export const terminalVisibleLogs = computed<TerminalLogEntry[]>(() => {
  const keyword = terminalQuery.value.trim().toLowerCase()
  return terminalLogs.value.filter((entry) => {
    if (!terminalLevelsVisible[entry.level]) return false
    if (!keyword) return true
    return (
      entry.message.toLowerCase().includes(keyword) ||
      entry.logger.toLowerCase().includes(keyword) ||
      entry.filename.toLowerCase().includes(keyword) ||
      entry.level.toLowerCase().includes(keyword)
    )
  })
})

/**
 * 终端单例控制器。
 *
 * 悬浮窗组件在 App 根部常驻挂载，展开/折叠与日志缓冲都在模块级共享，
 * 便于 DevTools 等入口跨页面调用 openTerminal() 展开同一悬浮窗。
 *
 * :return: 终端状态与动作集合
 */
export function useTerminal() {
  function openTerminal(): void {
    terminalMode.value = 'floating'
    terminalUnread.value = 0
  }

  function minimize(): void {
    terminalMode.value = 'minimized'
    terminalUnread.value = 0
  }

  function maximize(): void {
    terminalMode.value = 'maximized'
  }

  function toggleMaximized(): void {
    terminalMode.value = terminalMode.value === 'maximized' ? 'floating' : 'maximized'
  }

  /** 后端实时推送一条日志，超限时丢弃最旧行，最小化期间累计未读数 */
  function pushLog(entry: TerminalLogEntry): void {
    terminalLogs.value.push(entry)
    if (terminalLogs.value.length > MAX_LINES) {
      terminalLogs.value.splice(0, terminalLogs.value.length - MAX_LINES)
    }
    if (terminalMode.value === 'minimized') terminalUnread.value += 1
  }

  function clearLogs(): void {
    terminalLogs.value = []
  }

  function toggleLevel(level: TerminalLogLevel): void {
    terminalLevelsVisible[level] = !terminalLevelsVisible[level]
  }

  return {
    terminalMode,
    terminalLogs,
    terminalUnread,
    terminalAutoScroll,
    terminalQuery,
    terminalVisibleLogs,
    terminalLevelsVisible,
    openTerminal,
    minimize,
    maximize,
    toggleMaximized,
    pushLog,
    clearLogs,
    toggleLevel,
  }
}
