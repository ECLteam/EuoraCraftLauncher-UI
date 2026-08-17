import { computed, reactive, ref } from 'vue'
import type { TerminalLogEntry } from '@/types/api'

/** 日志级别，入参后端标准化后的 levelname */
export type LauncherLogLevel = TerminalLogEntry['level']

/** 日志环形缓冲上限，超出后丢弃最旧行以避免内存无限增长 */
const MAX_LINES = 300

/** 已收到的全部启动器日志行（环形，最新在末尾） */
export const launcherLogs = ref<TerminalLogEntry[]>([])
/** 新日志到达时是否自动滚动到底部 */
export const launcherAutoScroll = ref(true)
/** 关键词过滤，匹配消息/模块/文件名/级别（大小写不敏感） */
export const launcherQuery = ref('')

export const LAUNCHER_LOG_LEVELS: readonly LauncherLogLevel[] = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']

/** 各级别是否展示，默认隐藏 DEBUG 以避免刷屏 */
export const launcherLevelsVisible = reactive<Record<LauncherLogLevel, boolean>>({
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
export const launcherVisibleLogs = computed<TerminalLogEntry[]>(() => {
  const keyword = launcherQuery.value.trim().toLowerCase()
  return launcherLogs.value.filter((entry) => {
    if (!launcherLevelsVisible[entry.level]) return false
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
 * 启动器日志控制器（仅调试用途，由 DevTools 的日志全屏弹窗承载）。
 *
 * 订阅后端 ``launcher:log`` 事件维护环形缓冲，供日志视图过滤/搜索/复制。
 *
 * :return: 日志状态与动作集合
 */
export function useLauncherLog() {
  /** 后端实时推送一条日志，超限时丢弃最旧行 */
  function pushLog(entry: TerminalLogEntry): void {
    launcherLogs.value.push(entry)
    if (launcherLogs.value.length > MAX_LINES) {
      launcherLogs.value.splice(0, launcherLogs.value.length - MAX_LINES)
    }
  }

  function clearLogs(): void {
    launcherLogs.value = []
  }

  function toggleLevel(level: LauncherLogLevel): void {
    launcherLevelsVisible[level] = !launcherLevelsVisible[level]
  }

  return {
    launcherLogs,
    launcherAutoScroll,
    launcherQuery,
    launcherVisibleLogs,
    launcherLevelsVisible,
    pushLog,
    clearLogs,
    toggleLevel,
  }
}
