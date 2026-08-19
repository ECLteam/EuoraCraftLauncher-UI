import { afterEach, describe, expect, it, vi } from 'vitest'
import { detectSkinModel } from './useSkinModelDetector'

function stubImage(width: number, height: number, fail = false): void {
  vi.stubGlobal(
    'Image',
    class {
      width = width
      height = height
      src = ''
      onload: (() => void) | null = null
      onerror: ((error: unknown) => void) | null = null

      constructor() {
        queueMicrotask(() => (fail ? this.onerror?.(new Error('load failed')) : this.onload?.()))
      }
    }
  )
}

function stubCanvas(pixels: Uint8ClampedArray): void {
  const ctx = {
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: pixels })),
  }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
}

function skinPixels(classic: boolean): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(64 * 64 * 4)
  if (classic) {
    const index = (48 * 64 + 35) * 4
    pixels[index + 3] = 255
  }
  return pixels
}

describe('detectSkinModel', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('经典皮肤（左臂 x=35 有像素）返回 classic', async () => {
    stubImage(64, 64)
    stubCanvas(skinPixels(true))
    await expect(detectSkinModel('data:image/png;base64,xxx')).resolves.toBe('classic')
  })

  it('纤细皮肤（左臂 x=35 透明）返回 slim', async () => {
    stubImage(64, 64)
    stubCanvas(skinPixels(false))
    await expect(detectSkinModel('data:image/png;base64,xxx')).resolves.toBe('slim')
  })

  it('非 64×64 纹理默认返回 classic', async () => {
    stubImage(32, 32)
    await expect(detectSkinModel('data:image/png;base64,xxx')).resolves.toBe('classic')
  })

  it('图片加载失败时抛出异常', async () => {
    stubImage(0, 0, true)
    await expect(detectSkinModel('data:image/png;base64,xxx')).rejects.toThrow('皮肤图片加载失败')
  })
})
