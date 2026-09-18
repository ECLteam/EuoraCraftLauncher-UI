import type { SchematicAssetsBundle, SchematicSessionData } from '@/types/api'

export interface SchematicMaterial {
  name: string
  label: string
  count: number
  color: string
  thumbnail: string | null
  hasTexture: boolean
  hasTranslation: boolean
}

export type SchematicMaterialFilter = 'all' | 'missing-texture' | 'missing-translation'
export type SchematicMaterialSort = 'count-desc' | 'count-asc' | 'name-asc'

export function buildSchematicMaterials(
  data: SchematicSessionData | null,
  assets: SchematicAssetsBundle | null,
  thumbnails: Record<string, string>
): SchematicMaterial[] {
  const palette = new Map(data?.palette.map((entry) => [entry.name, entry.color]) ?? [])
  const missingTextures = new Set(assets?.missingBlocks ?? [])
  const blockNames = assets?.blockNames ?? {}
  return Object.entries(data?.materialCounts ?? {}).map(([name, count]) => ({
    name,
    label: blockNames[name] ?? name,
    count,
    color: `rgb(${(palette.get(name) ?? [140, 140, 140]).join(',')})`,
    thumbnail: thumbnails[name] ?? null,
    hasTexture: !missingTextures.has(name),
    hasTranslation: name in blockNames,
  }))
}

export function filterSchematicMaterials(
  materials: SchematicMaterial[],
  query: string,
  filter: SchematicMaterialFilter,
  sort: SchematicMaterialSort
): SchematicMaterial[] {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  return materials
    .filter((material) => {
      if (filter === 'missing-texture' && material.hasTexture) return false
      if (filter === 'missing-translation' && material.hasTranslation) return false
      return !normalizedQuery || `${material.label} ${material.name}`.toLocaleLowerCase().includes(normalizedQuery)
    })
    .sort((left, right) => {
      if (sort === 'name-asc') return left.label.localeCompare(right.label, undefined, { numeric: true })
      const countOrder = sort === 'count-desc' ? right.count - left.count : left.count - right.count
      return countOrder || left.label.localeCompare(right.label, undefined, { numeric: true })
    })
}
