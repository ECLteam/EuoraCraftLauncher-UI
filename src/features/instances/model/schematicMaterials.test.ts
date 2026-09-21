import { describe, expect, it } from 'vitest'
import { filterSchematicMaterials, type SchematicMaterial } from './schematicMaterials'

const materials: SchematicMaterial[] = [
  {
    name: 'minecraft:stone',
    label: '石头',
    count: 12,
    color: 'rgb(1, 1, 1)',
    thumbnail: null,
    hasTexture: true,
    hasTranslation: true,
  },
  {
    name: 'example:unknown',
    label: 'example:unknown',
    count: 2,
    color: 'rgb(2, 2, 2)',
    thumbnail: null,
    hasTexture: false,
    hasTranslation: false,
  },
]

describe('filterSchematicMaterials', () => {
  it('按本地化名称或方块 ID 搜索并按数量排序', () => {
    expect(filterSchematicMaterials(materials, '石头', 'all', 'count-desc')).toEqual([materials[0]])
    expect(filterSchematicMaterials(materials, 'unknown', 'all', 'count-desc')).toEqual([materials[1]])
  })

  it('筛选没有纹理或翻译的材料', () => {
    expect(filterSchematicMaterials(materials, '', 'missing-texture', 'count-desc')).toEqual([materials[1]])
    expect(filterSchematicMaterials(materials, '', 'missing-translation', 'count-desc')).toEqual([materials[1]])
  })
})
