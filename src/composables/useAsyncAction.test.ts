import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAsyncAction } from './useAsyncAction'

const messages = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock('./useLauncherMessage', () => ({
  useLauncherMessage: () => messages,
}))

describe('useAsyncAction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not show a success message when an action is cancelled', async () => {
    const { run } = useAsyncAction()

    const result = await run(() => Promise.resolve(false), {
      showSuccess: true,
      successMessage: 'installed',
    })

    expect(result).toBe(false)
    expect(messages.success).not.toHaveBeenCalled()
  })

  it('continues to show success for void actions', async () => {
    const { run } = useAsyncAction()

    await run(() => Promise.resolve(), {
      showSuccess: true,
      successMessage: 'done',
    })

    expect(messages.success).toHaveBeenCalledWith('done')
  })
})
