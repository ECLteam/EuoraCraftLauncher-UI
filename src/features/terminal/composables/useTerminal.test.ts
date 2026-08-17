import { beforeEach, describe, expect, it } from 'vitest'
import {
  TERMINAL_LEVELS,
  terminalAutoScroll,
  terminalLevelsVisible,
  terminalLogs,
  terminalMode,
  terminalQuery,
  terminalUnread,
  useTerminal,
} from './useTerminal'

const MAX_LINES = 2000

function sample(level: string, message = 'hello', overrides: Record<string, unknown> = {}) {
  return {
    time: '00:00:00',
    level,
    logger: 'EuoraCraft-Launcher.Test',
    filename: 'sample.py',
    lineno: 1,
    message,
    ...overrides,
  }
}

describe('useTerminal 日志终端状态', () => {
  beforeEach(() => {
    terminalMode.value = 'minimized'
    terminalUnread.value = 0
    terminalLogs.value = []
    terminalQuery.value = ''
    terminalAutoScroll.value = true
    for (const level of TERMINAL_LEVELS) {
      terminalLevelsVisible[level] = level !== 'DEBUG'
    }
  })

  it('openTerminal 切换为浮动形态并清零未读数', () => {
    const terminal = useTerminal()
    terminalUnread.value = 7
    terminal.openTerminal()
    expect(terminalMode.value).toBe('floating')
    expect(terminalUnread.value).toBe(0)
  })

  it('pushLog 在最小化时累计未读数，展开时清零', () => {
    const terminal = useTerminal()
    terminal.pushLog(sample('INFO'))
    terminal.pushLog(sample('WARNING'))
    expect(terminalUnread.value).toBe(2)
    expect(terminalLogs.value).toHaveLength(2)

    terminal.openTerminal()
    expect(terminalUnread.value).toBe(0)
    terminal.pushLog(sample('ERROR'))
    expect(terminalUnread.value).toBe(0)
  })

  it('级别过滤默认隐藏 DEBUG，可切换', () => {
    const terminal = useTerminal()
    terminal.pushLog(sample('DEBUG', 'debug-line'))
    terminal.pushLog(sample('INFO', 'info-line'))
    expect(terminalLogs.value).toHaveLength(2)
    expect(terminal.terminalVisibleLogs.value.map((l) => l.message)).toEqual(['info-line'])

    terminal.toggleLevel('DEBUG')
    expect(terminal.terminalVisibleLogs.value.map((l) => l.message)).toContain('debug-line')
  })

  it('关键词过滤按大小写不敏感匹配', () => {
    const terminal = useTerminal()
    terminal.pushLog(sample('INFO', 'Config loaded from file'))
    terminal.pushLog(sample('INFO', 'starting download'))
    terminalQuery.value = 'CONFIG'
    expect(terminal.terminalVisibleLogs.value).toHaveLength(1)
    expect(terminal.terminalVisibleLogs.value[0]?.message).toContain('Config loaded')
  })

  it('clearLogs 清空日志缓冲', () => {
    const terminal = useTerminal()
    terminal.pushLog(sample('INFO'))
    terminal.clearLogs()
    expect(terminalLogs.value).toHaveLength(0)
    expect(terminal.terminalVisibleLogs.value).toHaveLength(0)
  })

  it('环形缓冲只保留最近日志', () => {
    const terminal = useTerminal()
    for (let i = 0; i < MAX_LINES + 10; i++) {
      terminal.pushLog(sample('DEBUG', `line-${i}`))
    }
    expect(terminalLogs.value).toHaveLength(MAX_LINES)
    expect(terminalLogs.value[0]?.message).toBe('line-10')
    expect(terminalLogs.value[MAX_LINES - 1]?.message).toBe(`line-${MAX_LINES + 9}`)
  })
})
