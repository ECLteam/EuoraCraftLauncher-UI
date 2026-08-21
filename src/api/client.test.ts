import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { launcherErrorQueue } from '@/app/runtime/errorPresentation'
import backend from './client'

const transportMocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  listen: vi.fn(),
}))

vi.mock('./transport', () => ({
  createBackendTransport: () => ({
    mode: 'desktop',
    available: true,
    invoke: transportMocks.invoke,
    listen: transportMocks.listen,
    convertFileSrc: vi.fn((path: string) => path),
  }),
}))

vi.mock('./transport/showcase', () => ({
  createShowcaseTransport: vi.fn(() => ({
    mode: 'showcase',
    available: true,
    invoke: vi.fn(),
    listen: vi.fn(async () => () => undefined),
    convertFileSrc: vi.fn(() => null),
  })),
}))

describe('backend IPC client', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    transportMocks.invoke.mockReset()
    transportMocks.listen.mockReset()
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

  it('reads local images as data URLs without relying on the Tauri asset protocol', async () => {
    transportMocks.invoke.mockResolvedValueOnce({
      success: true,
      data: { dataUrl: 'data:image/webp;base64,UklGRg==' },
    })

    await expect(backend.file.toUrl('E:\\ECL_data\\cache\\screenshots\\thumb.webp')).resolves.toBe(
      'data:image/webp;base64,UklGRg=='
    )
    expect(transportMocks.invoke).toHaveBeenCalledWith('image_read_file', {
      path: 'E:\\ECL_data\\cache\\screenshots\\thumb.webp',
    })
  })

  it('off 会清理同一回调的所有重复订阅', async () => {
    const firstUnlisten = vi.fn()
    const secondUnlisten = vi.fn()
    transportMocks.listen.mockResolvedValueOnce(firstUnlisten).mockResolvedValueOnce(secondUnlisten)
    const handler = vi.fn()

    backend.on('launcher:notify', handler)
    backend.on('launcher:notify', handler)
    await backend.waitForEventListeners()
    backend.off('launcher:notify', handler)

    expect(firstUnlisten).toHaveBeenCalledTimes(1)
    expect(secondUnlisten).toHaveBeenCalledTimes(1)
  })

  it('切换展示模式后会更新供 Vue 使用的响应式状态', () => {
    expect(backend.runtime.isShowcaseState.value).toBe(false)

    backend.swapToShowcase()

    expect(backend.runtime.modeState.value).toBe('desktop')
    expect(backend.runtime.isShowcaseState.value).toBe(true)
  })
})
