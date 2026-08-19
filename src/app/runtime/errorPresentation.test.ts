import { describe, expect, it } from 'vitest'
import {
  BackendCommandError,
  createLauncherErrorQueue,
  launcherErrorQueue,
  setErrorNotifier,
  unwrapResponse,
} from './errorPresentation'

describe('launcher error presentation', () => {
  it('queues serious errors in order and deduplicates by error id', () => {
    const errors = createLauncherErrorQueue()
    const first = { error_id: 'error-1', title: 'First', message: 'First failure' }

    expect(errors.enqueue(first)).toBe(true)
    expect(errors.enqueue(first)).toBe(false)
    expect(errors.enqueue({ error_id: 'error-2', title: 'Second', message: 'Second failure' })).toBe(true)
    expect(errors.activeError.value).toEqual(first)

    errors.dismissActive()
    expect(errors.activeError.value?.error_id).toBe('error-2')
  })

  it('preserves structured crash data while deduplicating event and response ids', () => {
    const errors = createLauncherErrorQueue()
    const crash = {
      reportId: 'a'.repeat(32),
      versionId: '1.21.8',
      exitCode: 1,
      detectedBy: ['exit_code'],
      reasons: [],
      sourceFiles: ['latest.log'],
      hasOutput: true,
    }

    expect(
      errors.enqueue({
        error_id: crash.reportId,
        title: 'Minecraft crash',
        message: 'Instance exited',
        kind: 'game_crash',
        crash,
      })
    ).toBe(true)
    expect(errors.enqueue({ error_id: crash.reportId, title: 'Duplicate', message: 'Instance exited' })).toBe(false)
    expect(errors.activeError.value?.crash).toEqual(crash)
  })

  it('unwraps ordinary failures without opening a modal', () => {
    expect(() =>
      unwrapResponse(
        { success: false, message: 'Invalid value', errorCode: 'INVALID', presentation: 'message' },
        'Save'
      )
    ).toThrow(BackendCommandError)
  })

  it('notifies ordinary failures via the injected notifier and suppresses duplicates', () => {
    const notified: string[] = []
    setErrorNotifier((message) => notified.push(message))
    try {
      expect(() =>
        unwrapResponse(
          { success: false, message: 'Invalid value', errorCode: 'INVALID', presentation: 'message' },
          'Save'
        )
      ).toThrow(BackendCommandError)
    } finally {
      setErrorNotifier(() => {})
    }
    expect(notified).toEqual(['Invalid value'])
    expect(launcherErrorQueue.consumeSuppressedMessage('Invalid value')).toBe(true)
    expect(launcherErrorQueue.consumeSuppressedMessage('Invalid value')).toBe(false)
  })

  it('queues modal failures and suppresses the duplicate message once', () => {
    const errorId = `modal-${Date.now()}`
    expect(() =>
      unwrapResponse(
        {
          success: false,
          message: 'Storage failed',
          errorCode: 'SAVE_FAILED',
          presentation: 'modal',
          errorId,
          title: 'Storage error',
        },
        'Save'
      )
    ).toThrow(BackendCommandError)

    expect(launcherErrorQueue.activeError.value?.error_id).toBe(errorId)
    expect(launcherErrorQueue.consumeSuppressedMessage('Storage failed')).toBe(true)
    expect(launcherErrorQueue.consumeSuppressedMessage('Storage failed')).toBe(false)
    launcherErrorQueue.dismissActive()
  })
})
