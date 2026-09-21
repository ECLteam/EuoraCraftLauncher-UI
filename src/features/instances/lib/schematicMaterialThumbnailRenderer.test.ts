import { describe, expect, it } from 'vitest'
import type { SchematicPaletteEntry } from '@/types/api'
import { schematicThumbnailEntries } from './schematicMaterialThumbnailRenderer'

describe('schematicThumbnailEntries', () => {
  it('跳过空气并为同一方块保留首个状态作为缩略图代表', () => {
    const entries: SchematicPaletteEntry[] = [
      { name: 'minecraft:air', properties: {}, color: [0, 0, 0] },
      { name: 'minecraft:rail', properties: { shape: 'north_south' }, color: [100, 100, 100] },
      { name: 'minecraft:rail', properties: { shape: 'east_west' }, color: [100, 100, 100] },
      { name: 'minecraft:torch', properties: {}, color: [255, 200, 80] },
    ]

    expect(schematicThumbnailEntries(entries)).toEqual([entries[1], entries[3]])
  })
})
