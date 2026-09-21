import { describe, expect, it, vi } from 'vitest'
import type { BackendMockState } from '@/test/mockBackend'
import { instanceRuntimeApi } from './instanceRuntimeApi'

const mock = vi.hoisted<{ state?: BackendMockState }>(() => ({ state: undefined }))
vi.mock('@/api/client', async () => {
  const { createMockBackend } = await import('@/test/mockBackend')
  mock.state = createMockBackend()
  return mock.state.backend
})

const { mocks } = mock.state!

describe('instanceRuntimeApi', () => {
  it('coalesces concurrent running-instance snapshots without caching settled state', async () => {
    let resolveRequest: ((value: unknown) => void) | undefined
    mocks.command.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve
        })
    )

    const first = instanceRuntimeApi.list()
    const second = instanceRuntimeApi.list()
    expect(mocks.command).toHaveBeenCalledOnce()

    resolveRequest?.({ success: true, data: [] })
    await expect(Promise.all([first, second])).resolves.toEqual([[], []])

    mocks.command.mockResolvedValueOnce({ success: true, data: [] })
    await instanceRuntimeApi.list()
    expect(mocks.command).toHaveBeenCalledTimes(2)
  })
})
