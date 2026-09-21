import { BlockDefinition, BlockModel, BlockState, Identifier, Mesh as ModelMesh, SpecialRenderers } from 'deepslate'
import type { SchematicAssetsBundle, SchematicPaletteEntry } from '@/types/api'
import { blockCullMask, faceDirections } from './schematicFaceCulling'

type Coord = [number, number, number]
type Uv = [number, number, number, number]
type GeometryData = { positions: Float32Array; colors: Float32Array; uvs: Float32Array; normals: Float32Array }
type InitMessage = {
  type: 'init'
  palette: SchematicPaletteEntry[]
  assets: Pick<SchematicAssetsBundle, 'blockstates' | 'models'>
  uvById: Record<string, Uv>
  chunks: Coord[]
  size: Coord
  chunkSize: number
}
type WorkerMessage =
  | InitMessage
  | { type: 'chunks'; chunks: Array<{ coord: Coord; indices: string }> }
  | { type: 'desired'; coords: Coord[] }
  | { type: 'layers'; value: number }

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerMessage>) => void) | null
  postMessage: (data: unknown, transfer?: Transferable[]) => void
}
const transparentTerms = ['glass', 'water', 'lava', 'ice', 'portal']
const partialTerms = [
  'leaves',
  'button',
  'lever',
  'pressure',
  'door',
  'trapdoor',
  'fence',
  'wall',
  'sign',
  'banner',
  'torch',
  'rail',
  'ladder',
  'vine',
  'carpet',
  'sapling',
  'flower',
  'grass',
  'fern',
  'plant',
  'mushroom',
  'kelp',
  'seagrass',
  'coral',
  'scaffolding',
  'candle',
  'lantern',
  'chain',
  'bell',
  'slab',
  'stairs',
  'anvil',
  'chest',
  'cauldron',
  'hopper',
  'brewing_stand',
  'piston',
  'redstone',
]

let palette: SchematicPaletteEntry[] = []
let definitions: Record<string, BlockDefinition> = {}
let models: Record<string, BlockModel> = {}
let modelJson: Record<string, unknown> = {}
let uvById: Record<string, Uv> = {}
let knownChunks = new Set<string>()
const loadedChunks = new Map<string, Uint16Array>()
let desiredChunks = new Set<string>()
const dirtyChunks = new Set<string>()
let opaqueCubes: boolean[] = []
let size: Coord = [1, 1, 1]
let chunkSize = 16
let visibleLayers = 1
let processing = false

function key(coord: Coord): string {
  return coord.join(',')
}

function parseKey(value: string): Coord {
  const [x = 0, y = 0, z = 0] = value.split(',').map(Number)
  return [x, y, z]
}

function normalizeId(value: string): string {
  return value.includes(':') ? value : `minecraft:${value}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizeModel(value: unknown): unknown {
  if (!isRecord(value) || !isRecord(value.textures)) return value
  return {
    ...value,
    textures: Object.fromEntries(
      Object.entries(value.textures).map(([name, reference]) => [
        name,
        isRecord(reference) && typeof reference.sprite === 'string' ? reference.sprite : reference,
      ])
    ),
  }
}

function isTransparent(name: string): boolean {
  return transparentTerms.some((term) => name.includes(term))
}

function fullCubeModel(modelId: string): boolean {
  const visited = new Set<string>()
  let current = normalizeId(modelId)
  while (!visited.has(current)) {
    visited.add(current)
    const payload = modelJson[current]
    if (!isRecord(payload)) return false
    if (Array.isArray(payload.elements)) {
      if (payload.elements.length !== 1) return false
      const element = payload.elements[0]
      if (!isRecord(element) || element.rotation || !Array.isArray(element.from) || !Array.isArray(element.to))
        return false
      if (element.from.join(',') !== '0,0,0' || element.to.join(',') !== '16,16,16') return false
      const faces = element.faces
      if (!isRecord(faces)) return false
      return faceDirections.every(({ name }) => isRecord(faces[name]) && faces[name].cullface === name)
    }
    if (typeof payload.parent !== 'string') return false
    current = normalizeId(payload.parent)
  }
  return false
}

function isOpaqueCube(entry: SchematicPaletteEntry): boolean {
  if (isTransparent(entry.name) || partialTerms.some((term) => entry.name.includes(term))) return false
  const definition = definitions[entry.name]
  if (!definition) return false
  const variants = definition.getModelVariants(entry.properties)
  return variants.length === 1 && fullCubeModel(variants[0]!.model)
}

function blockAt(x: number, y: number, z: number): number {
  if (x < 0 || y < 0 || z < 0 || x >= size[0] || y >= visibleLayers || z >= size[2]) return 0
  const coord: Coord = [Math.floor(x / chunkSize), Math.floor(y / chunkSize), Math.floor(z / chunkSize)]
  const chunk = loadedChunks.get(key(coord))
  if (!chunk) return 0
  return chunk[((y % chunkSize) * chunkSize + (z % chunkSize)) * chunkSize + (x % chunkSize)] ?? 0
}

function decodeIndices(encoded: string): Uint16Array {
  const binary = atob(encoded)
  const result = new Uint16Array(chunkSize ** 3)
  for (let index = 0; index < result.length; index += 1)
    result[index] = binary.charCodeAt(index * 2) | (binary.charCodeAt(index * 2 + 1) << 8)
  return result
}

function emptyGeometry(): { positions: number[]; colors: number[]; uvs: number[]; normals: number[] } {
  return { positions: [], colors: [], uvs: [], normals: [] }
}

function addQuad(
  target: ReturnType<typeof emptyGeometry>,
  vertices: Array<{ position: Coord; color: Coord; uv: [number, number] }>,
  normal: Coord
): void {
  for (const index of [0, 1, 2, 0, 2, 3]) {
    const vertex = vertices[index]!
    target.positions.push(...vertex.position)
    target.colors.push(...vertex.color)
    target.uvs.push(...vertex.uv)
    target.normals.push(...normal)
  }
}

function addModel(target: ReturnType<typeof emptyGeometry>, mesh: ModelMesh, origin: Coord): void {
  for (const quad of mesh.quads) {
    const normal = quad.normal().components()
    const vertices = quad.vertices().map((vertex) => ({
      position: [vertex.pos.x + origin[0], vertex.pos.y + origin[1], vertex.pos.z + origin[2]] as Coord,
      color: vertex.color as Coord,
      uv: vertex.texture ?? [0, 0],
    }))
    addQuad(target, vertices, normal)
  }
}

function addFallback(
  target: ReturnType<typeof emptyGeometry>,
  entry: SchematicPaletteEntry,
  origin: Coord,
  cull: Record<string, boolean>
): void {
  const color = entry.color.map((value) => value / 255) as Coord
  const [u0, v0, u1, v1] = uvById['minecraft:missingno'] ?? [0, 0, 1, 1]
  const faces: Array<{ name: string; corners: Coord[]; normal: Coord }> = [
    {
      name: 'up',
      corners: [
        [0, 1, 0],
        [0, 1, 1],
        [1, 1, 1],
        [1, 1, 0],
      ],
      normal: [0, 1, 0],
    },
    {
      name: 'down',
      corners: [
        [0, 0, 1],
        [0, 0, 0],
        [1, 0, 0],
        [1, 0, 1],
      ],
      normal: [0, -1, 0],
    },
    {
      name: 'north',
      corners: [
        [1, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
        [1, 1, 0],
      ],
      normal: [0, 0, -1],
    },
    {
      name: 'south',
      corners: [
        [0, 0, 1],
        [1, 0, 1],
        [1, 1, 1],
        [0, 1, 1],
      ],
      normal: [0, 0, 1],
    },
    {
      name: 'east',
      corners: [
        [1, 0, 1],
        [1, 0, 0],
        [1, 1, 0],
        [1, 1, 1],
      ],
      normal: [1, 0, 0],
    },
    {
      name: 'west',
      corners: [
        [0, 0, 0],
        [0, 0, 1],
        [0, 1, 1],
        [0, 1, 0],
      ],
      normal: [-1, 0, 0],
    },
  ]
  for (const face of faces) {
    if (cull[face.name]) continue
    addQuad(
      target,
      face.corners.map((corner, index) => ({
        position: [origin[0] + corner[0], origin[1] + corner[1], origin[2] + corner[2]],
        color,
        uv: (
          [
            [u0, v0],
            [u1, v0],
            [u1, v1],
            [u0, v1],
          ] as [number, number][]
        )[index]!,
      })),
      face.normal
    )
  }
}

const atlasProvider = {
  getTextureAtlas: () => new ImageData(1, 1),
  getTextureUV: (id: Identifier): Uv => uvById[id.toString()] ?? uvById['minecraft:missingno'] ?? [0, 0, 1, 1],
}

function meshChunk(coord: Coord): { opaque: GeometryData; transparent: GeometryData } {
  const indices = loadedChunks.get(key(coord))!
  const opaque = emptyGeometry()
  const transparent = emptyGeometry()
  const origin: Coord = [coord[0] * chunkSize, coord[1] * chunkSize, coord[2] * chunkSize]
  for (let index = 0; index < indices.length; index += 1) {
    const paletteIndex = indices[index] ?? 0
    if (!paletteIndex) continue
    const entry = palette[paletteIndex]
    if (!entry) continue
    const x = origin[0] + (index % chunkSize)
    const row = Math.floor(index / chunkSize)
    const z = origin[2] + (row % chunkSize)
    const y = origin[1] + Math.floor(row / chunkSize)
    if (y >= visibleLayers) continue
    const cull = blockCullMask([x, y, z], paletteIndex, blockAt, opaqueCubes, isTransparent(entry.name))
    if (opaqueCubes[paletteIndex] && faceDirections.every(({ name }) => cull[name])) continue
    const target = isTransparent(entry.name) ? transparent : opaque
    try {
      const blockName = Identifier.parse(entry.name)
      const definition = definitions[entry.name]
      const mesh = definition
        ? definition.getMesh(
            blockName,
            entry.properties,
            atlasProvider,
            { getBlockModel: (id) => models[id.toString()] ?? null },
            cull
          )
        : new ModelMesh()
      mesh.merge(
        SpecialRenderers.getBlockMesh(new BlockState(blockName, entry.properties), undefined, atlasProvider, cull)
      )
      if (mesh.isEmpty()) addFallback(target, entry, [x, y, z], cull)
      else addModel(target, mesh, [x, y, z])
    } catch {
      addFallback(target, entry, [x, y, z], cull)
    }
  }
  const freeze = (source: ReturnType<typeof emptyGeometry>): GeometryData => ({
    positions: new Float32Array(source.positions),
    colors: new Float32Array(source.colors),
    uvs: new Float32Array(source.uvs),
    normals: new Float32Array(source.normals),
  })
  return { opaque: freeze(opaque), transparent: freeze(transparent) }
}

function ready(coord: Coord): boolean {
  if (!loadedChunks.has(key(coord))) return false
  return faceDirections.every(({ delta }) => {
    const neighbor: Coord = [coord[0] + delta[0], coord[1] + delta[1], coord[2] + delta[2]]
    const neighborKey = key(neighbor)
    return !knownChunks.has(neighborKey) || loadedChunks.has(neighborKey)
  })
}

function schedule(coord: Coord): void {
  const chunkKey = key(coord)
  if (!desiredChunks.has(chunkKey) || !ready(coord)) return
  dirtyChunks.add(chunkKey)
  if (processing) return
  processing = true
  setTimeout(processNext, 0)
}

function processNext(): void {
  const next = dirtyChunks.values().next().value as string | undefined
  if (!next) {
    processing = false
    return
  }
  dirtyChunks.delete(next)
  if (desiredChunks.has(next) && ready(parseKey(next))) {
    const result = meshChunk(parseKey(next))
    const buffers = [
      result.opaque.positions.buffer,
      result.opaque.colors.buffer,
      result.opaque.uvs.buffer,
      result.opaque.normals.buffer,
      result.transparent.positions.buffer,
      result.transparent.colors.buffer,
      result.transparent.uvs.buffer,
      result.transparent.normals.buffer,
    ]
    workerScope.postMessage({ type: 'mesh', coord: parseKey(next), layers: visibleLayers, ...result }, buffers)
  }
  setTimeout(processNext, 0)
}

workerScope.onmessage = ({ data }) => {
  if (data.type === 'init') {
    palette = data.palette
    size = data.size
    chunkSize = data.chunkSize
    visibleLayers = size[1]
    uvById = data.uvById
    knownChunks = new Set(data.chunks.map(key))
    modelJson = data.assets.models
    definitions = {}
    models = {}
    for (const [id, payload] of Object.entries(data.assets.blockstates)) {
      try {
        definitions[id] = BlockDefinition.fromJson(payload)
      } catch {
        // 无效模型在分块构建时回退到色板方块。
      }
    }
    for (const [id, payload] of Object.entries(modelJson)) {
      try {
        models[id] = BlockModel.fromJson(normalizeModel(payload))
      } catch {
        // 单个模型损坏不阻断预览。
      }
    }
    const provider = { getBlockModel: (id: Identifier) => models[id.toString()] ?? null }
    for (const model of Object.values(models)) {
      try {
        model.flatten(provider)
      } catch {
        // 缺失父模型时保留其他可用模型。
      }
    }
    opaqueCubes = palette.map(isOpaqueCube)
    workerScope.postMessage({ type: 'ready' })
  } else if (data.type === 'chunks') {
    for (const chunk of data.chunks) {
      loadedChunks.set(key(chunk.coord), decodeIndices(chunk.indices))
      schedule(chunk.coord)
      for (const { delta } of faceDirections)
        schedule([chunk.coord[0] + delta[0], chunk.coord[1] + delta[1], chunk.coord[2] + delta[2]])
    }
  } else if (data.type === 'desired') {
    const previous = desiredChunks
    desiredChunks = new Set(data.coords.map(key))
    for (const coord of data.coords) if (!previous.has(key(coord))) schedule(coord)
    for (const chunkKey of dirtyChunks) if (!desiredChunks.has(chunkKey)) dirtyChunks.delete(chunkKey)
  } else if (data.type === 'layers') {
    const oldBoundary = Math.floor((visibleLayers - 1) / chunkSize)
    visibleLayers = Math.max(1, Math.min(size[1], data.value))
    const newBoundary = Math.floor((visibleLayers - 1) / chunkSize)
    for (const chunkKey of desiredChunks) {
      const coord = parseKey(chunkKey)
      if (coord[1] === oldBoundary || coord[1] === newBoundary) schedule(coord)
    }
  }
}
