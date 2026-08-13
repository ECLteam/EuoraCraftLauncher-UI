import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { launcherErrorQueue } from '@/app/runtime/errorPresentation'
import backend from './client'

const transportMocks = vi.hoisted(() => ({
  invoke: vi.fn(),
}))

vi.mock('./transport', () => ({
  createBackendTransport: () => ({
    mode: 'desktop',
    available: true,
    invoke: transportMocks.invoke,
    listen: vi.fn(async () => () => undefined),
    convertFileSrc: vi.fn((path: string) => path),
  }),
}))

vi.mock('./transport/showcase', () => ({
  createShowcaseTransport: vi.fn(),
}))

describe('backend IPC client', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    transportMocks.invoke.mockReset()
    while (launcherErrorQueue.activeError.value) launcherErrorQueue.dismissActive()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('launch_instance 超过 30 秒时仍等待补全文件任务返回', async () => {
    let resolveInvoke: ((value: unknown) => void) | undefined
    transportMocks.invoke.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveInvoke = resolve
        })
    )

    const request = backend.command('game_launch', {
      version_id: '1.21.1',
      game_path: 'C:\\Minecraft',
    })
    let settled = false
    void request.then(() => {
      settled = true
    })

    await vi.advanceTimersByTimeAsync(30_001)
    expect(settled).toBe(false)

    resolveInvoke?.({ success: true, data: { instanceId: 'mc-1' } })
    await expect(request).resolves.toMatchObject({ success: true })
  })

  it('queues modal failures returned directly by the backend', async () => {
    transportMocks.invoke.mockResolvedValueOnce({
      success: false,
      message: 'Unable to save data',
      errorCode: 'SAVE_FAILED',
      presentation: 'modal',
      errorId: 'save-error',
      title: 'Storage error',
    })

    await backend.command('game_instances')

    expect(launcherErrorQueue.activeError.value).toEqual({
      error_id: 'save-error',
      message: 'Unable to save data',
      title: 'Storage error',
      detail: undefined,
    })
  })
})
