import { describe, expect, it } from 'vitest'
import type { SchematicAssetsBundle, SchematicPreviewData } from '@/types/api'
import { buildSchematicStructure, computeWorldBox } from './schematicStructureRenderer'

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
})
