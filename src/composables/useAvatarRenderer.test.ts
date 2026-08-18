import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearAvatarCache, renderSkinAvatar, useAvatarRenderer } from './useAvatarRenderer'

describe('renderSkinAvatar', () => {
  afterEach(() => {
    clearAvatarCache()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it(async () => {
    class MockImage {
      naturalWidth = 64
      naturalHeight = 64
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      crossOrigin = ''

      set src(_value: string) {
        this.onload?.()
      }
    }
    vi.stubGlobal('Image', MockImage)

    const drawImage = vi.fn()
    const context = { drawImage, imageSmoothingEnabled: true }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,avatar')

    const result = await renderSkinAvatar('data:image/png;base64,skin', 32)

    expect(result).toBe('data:image/png;base64,avatar')
    expect(context.imageSmoothingEnabled).toBe(false)
    expect(drawImage).toHaveBeenNthCalledWith(1, expect.anything(), 8, 8, 8, 8, 4, 4, 48, 48)
    expect(drawImage).toHaveBeenNthCalledWith(2, expect.anything(), 40, 8, 8, 8, 0, 0, 56, 56)
  })

  it('合并相同账户的并发渲染并复用 LRU 结果', async () => {
    class MockImage {
      naturalWidth = 64
      naturalHeight = 64
      onload: (() => void) | null = null
      onerror: (() => void) | null = null

      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    }
    vi.stubGlobal('Image', MockImage)
    const drawImage = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
      imageSmoothingEnabled: true,
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,cached')
    const first = useAvatarRenderer()
    const second = useAvatarRenderer()

    const results = await Promise.all([
      first.renderAvatar('uuid', 'Player', 32),
      second.renderAvatar('uuid', 'Player', 32),
    ])
    const cached = await first.renderAvatar('uuid', 'Player', 32)

    expect(results).toEqual(['data:image/png;base64,cached', 'data:image/png;base64,cached'])
    expect(cached).toBe('data:image/png;base64,cached')
    expect(drawImage).toHaveBeenCalledTimes(2)
  })
})
