import { Group } from 'three'
import { describe, expect, it, vi } from 'vitest'
import { createSkinLayer3d } from './skinLayer3d'

function createViewer(
  width: number,
  height: number,
  pixels = new Uint8ClampedArray(64 * 64 * 4)
): Parameters<typeof createSkinLayer3d>[0] {
  const outerLayers = Array.from({ length: 6 }, () => {
    const parent = new Group()
    const outerLayer = new Group()
    parent.add(outerLayer)
    return outerLayer
  })
  const skinParts = {
    head: { outerLayer: outerLayers[0] },
    body: { outerLayer: outerLayers[1] },
    rightArm: { outerLayer: outerLayers[2] },
    leftArm: { outerLayer: outerLayers[3] },
    rightLeg: { outerLayer: outerLayers[4] },
    leftLeg: { outerLayer: outerLayers[5] },
  }
  return {
    skinCanvas: {
      width,
      height,
      getContext: vi.fn(() => ({ getImageData: vi.fn(() => ({ data: pixels })) })),
    },
    playerObject: { skin: skinParts },
  } as unknown as Parameters<typeof createSkinLayer3d>[0]
}

describe('createSkinLayer3d', () => {
  it('只为标准 64×64 皮肤创建像素方块', () => {
    const viewer = createViewer(128, 128)

    expect(createSkinLayer3d(viewer, 'classic')).toBeNull()
  })

  it('将第二层的非透明像素挂到对应肢体，并在释放时移除', () => {
    const pixels = new Uint8ClampedArray(64 * 64 * 4)
    const frontHeadPixelOffset = (8 * 64 + 40) * 4
    pixels.set([255, 0, 0, 255], frontHeadPixelOffset)
    const viewer = createViewer(64, 64, pixels)
    const headParent = viewer.playerObject.skin.head.outerLayer.parent as Group | null

    const layer = createSkinLayer3d(viewer, 'classic')

    expect(layer).not.toBeNull()
    expect(headParent?.children).toHaveLength(2)
    layer?.dispose()
    expect(headParent?.children).toHaveLength(1)
  })
})
