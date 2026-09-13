import { describe, expect, it } from 'vitest'
import type { SchematicAssetsBundle, SchematicPreviewData } from '@/types/api'
import {
  buildSchematicPreview,
  buildSchematicStructure,
  computeWorldBox,
  maxDetailedBlocks,
  normalizeBlockModelTextures,
} from './schematicStructureRenderer'

const assets: SchematicAssetsBundle = {
  blockstates: { 'minecraft:stone': {} },
  models: {},
  textures: {},
  animated: [],
  missingBlocks: [],
}

const preview: SchematicPreviewData = {
  type: 'litematic',
  size: [4, 3, 2],
  regions: [
    {
      name: 'lower',
      position: [-2, 3, 1],
      size: [2, 2, 1],
      palette: [
        { name: 'minecraft:air', properties: {}, color: [0, 0, 0] },
        { name: 'minecraft:stone', properties: {}, color: [128, 128, 128] },
      ],
      indices: [1, 1, 1, 1],
    },
    {
      name: 'upper',
      position: [0, 4, 2],
      size: [1, 1, 1],
      palette: [{ name: 'minecraft:stone', properties: {}, color: [128, 128, 128] }],
      indices: [0],
    },
  ],
}

describe('schematicStructureRenderer', () => {
  it('保留多区域的真实世界包围范围', () => {
    expect(computeWorldBox(preview)).toEqual({ minX: -2, minY: 3, minZ: 1, width: 3, height: 2, depth: 2 })
  })

  it('按可见层构建带方块属性的结构', () => {
    const box = computeWorldBox(preview)
    expect(buildSchematicStructure(preview, assets, box, 1).getBlocks()).toHaveLength(2)
    expect(buildSchematicStructure(preview, assets, box, 2).getBlocks()).toHaveLength(5)
  })

  it('将新版模型中的对象纹理转换为 Deepslate 可读取的标识', () => {
    expect(
      normalizeBlockModelTextures({
        textures: {
          all: { force_translucent: true, sprite: 'minecraft:block/black_stained_glass' },
          overlay: { sprite: 'minecraft:block/redstone_dust_overlay' },
        },
      })
    ).toEqual({
      textures: {
        all: 'minecraft:block/black_stained_glass',
        overlay: 'minecraft:block/redstone_dust_overlay',
      },
    })
  })

  it('在超过模型方块上限时限制预览结构规模', () => {
    const largePreview: SchematicPreviewData = {
      type: 'schem',
      size: [maxDetailedBlocks + 1, 1, 1],
      regions: [
        {
          name: 'large',
          position: [0, 0, 0],
          size: [maxDetailedBlocks + 1, 1, 1],
          palette: [{ name: 'minecraft:stone', properties: {}, color: [128, 128, 128] }],
          indices: Array.from({ length: maxDetailedBlocks + 1 }, () => 0),
        },
      ],
    }
    const result = buildSchematicPreview(largePreview, assets, computeWorldBox(largePreview))
    expect(result.stats.simplified).toBe(true)
    expect(result.stats.renderedBlocks).toBeLessThanOrEqual(maxDetailedBlocks)
    expect(result.structure.getBlocks()).toHaveLength(result.stats.renderedBlocks)
  })
})
