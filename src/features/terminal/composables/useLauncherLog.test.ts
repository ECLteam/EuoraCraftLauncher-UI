import { beforeEach, describe, expect, it } from 'vitest'
import type { TerminalLogEntry } from '@/types/api'
import {
  LAUNCHER_LOG_LEVELS,
  launcherAutoScroll,
  launcherLevelsVisible,
  launcherLogs,
  launcherQuery,
  launcherVisibleLogs,
  useLauncherLog,
} from './useLauncherLog'

function log(overrides: Partial<TerminalLogEntry> = {}): TerminalLogEntry {
  return {
    time: '00:00:00',
    level: 'INFO',
    logger: 'launcher',
    filename: 'launcher.py',
    lineno: 1,
    message: 'hello world',
    ...overrides,
  }
}

describe('useLauncherLog 启动器日志状态', () => {
  beforeEach(() => {
    launcherLogs.value = []
    launcherAutoScroll.value = true
    launcherQuery.value = ''
    launcherLevelsVisible.DEBUG = true
    launcherLevelsVisible.INFO = true
    launcherLevelsVisible.WARNING = true
    launcherLevelsVisible.ERROR = true
    launcherLevelsVisible.CRITICAL = true
  })

  it('pushLog 追加日志并在超出上限时丢弃最旧行', () => {
    const { pushLog } = useLauncherLog()
    const limit = 300
    for (let i = 0; i < limit + 5; i++) pushLog(log({ message: `row-${i}` }))
    expect(launcherLogs.value).toHaveLength(limit)
    expect(launcherLogs.value[0]?.message).toBe('row-5')
    expect(launcherLogs.value.at(-1)?.message).toBe(`row-${limit + 4}`)
  })

  it('clearLogs 清空全部日志', () => {
    const { pushLog, clearLogs } = useLauncherLog()
    pushLog(log())
    expect(launcherLogs.value).toHaveLength(1)
    clearLogs()
    expect(launcherLogs.value).toHaveLength(0)
  })

  it('默认显示 DEBUG 及常规级别日志', () => {
    const { pushLog } = useLauncherLog()
    pushLog(log({ level: 'DEBUG' }))
    pushLog(log({ level: 'INFO' }))
    expect(launcherVisibleLogs.value.map((entry) => entry.level)).toEqual(['DEBUG', 'INFO'])
  })

  it('toggleLevel 切换级别可见性', () => {
    const { toggleLevel } = useLauncherLog()
    expect(launcherLevelsVisible.DEBUG).toBe(true)
    toggleLevel('DEBUG')
    expect(launcherLevelsVisible.DEBUG).toBe(false)
    toggleLevel('DEBUG')
    expect(launcherLevelsVisible.DEBUG).toBe(true)
  })

  it('按关键词过滤消息/文件/级别（大小写不敏感）', () => {
    const { pushLog } = useLauncherLog()
    pushLog(log({ message: 'server started' }))
    pushLog(log({ message: 'connection lost', filename: 'conn.py' }))
    pushLog(log({ level: 'WARNING', message: 'disk low' }))
    launcherQuery.value = 'CONN'
    expect(launcherVisibleLogs.value.map((entry) => entry.message)).toEqual(['connection lost'])
    launcherQuery.value = 'warning'
    expect(launcherVisibleLogs.value.map((entry) => entry.level)).toEqual(['WARNING'])
    launcherQuery.value = 'conn.py'
    expect(launcherVisibleLogs.value.map((entry) => entry.message)).toEqual(['connection lost'])
    launcherQuery.value = ''
    expect(launcherVisibleLogs.value).toHaveLength(3)
  })

  it('LEVELS 暴露的后端级别集合', () => {
    expect([...LAUNCHER_LOG_LEVELS]).toEqual(['DEBUG', 'INFO', 'WARNING', 'ERROR'])
  })
})
