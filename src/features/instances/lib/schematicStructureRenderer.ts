import {
  BlockDefinition,
  BlockModel,
  Structure,
  StructureRenderer,
  TextureAtlas,
  type BlockFlags,
  type Identifier,
  type Resources,
} from 'deepslate'
import { mat4, vec3 } from 'gl-matrix'
import type { SchematicAssetsBundle, SchematicPreviewData, SchematicRegionData } from '@/types/api'

const fallbackBlock = 'minecraft:stone'
export const maxDetailedBlocks = 24000

const semiTransparentKeywords = [
  'glass',
  'leaves',
  'water',
  'ice',
  'portal',
  'candle',
  'vine',
  'carpet',
  'sapling',
  'flower',
  'mushroom',
  'kelp',
  'seagrass',
  'coral',
  'scaffolding',
  'torch',
  'lantern',
  'chain',
]
const nonSolidKeywords = [
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
]

export interface WorldBox {
  minX: number
  minY: number
  minZ: number
  width: number
  height: number
  depth: number
}

export interface SchematicRenderStats {
  totalBlocks: number
  renderedBlocks: number
  simplified: boolean
}

function isAir(name: string): boolean {
  return name.endsWith(':air')
}

function blockFlags(id: Identifier): BlockFlags {
  const name = id.toString().split(':').at(-1) ?? ''
  const semiTransparent = semiTransparentKeywords.some((keyword) => name.includes(keyword))
  const nonSolid = nonSolidKeywords.some((keyword) => name.includes(keyword))
  const opaque = !semiTransparent && !nonSolid
  return { opaque, semi_transparent: semiTransparent, self_culling: opaque }
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function textureBlob(value: string): Blob {
  return new Blob([decodeBase64(value).buffer as ArrayBuffer], { type: 'image/png' })
}

async function buildTextureAtlas(bundle: SchematicAssetsBundle): Promise<TextureAtlas> {
  const entries: Array<{
    id: string
    image: ImageBitmap
    width: number
    height: number
    cellsX: number
    cellsY: number
  }> = []
  const animated = new Set(bundle.animated)
  for (const [id, encoded] of Object.entries(bundle.textures)) {
    try {
      const image = await createImageBitmap(textureBlob(encoded))
      const width = animated.has(id) ? 16 : Math.max(16, image.width)
      const height = animated.has(id) ? 16 : Math.max(16, image.height)
      entries.push({ id, image, width, height, cellsX: Math.ceil(width / 16), cellsY: Math.ceil(height / 16) })
    } catch {
      // 损坏纹理使用材质库的缺失纹理格，不阻断整个原理图预览。
    }
  }
  let side = 4
  const requiredCells = entries.reduce((total, entry) => total + entry.cellsX * entry.cellsY, 1)
  while (side * side < requiredCells * 2) side *= 2
  const pixels = side * 16
  const canvas = document.createElement('canvas')
  canvas.width = pixels
  canvas.height = pixels
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法创建原理图纹理画布')
  context.fillStyle = '#000'
  context.fillRect(0, 0, 16, 16)
  context.fillStyle = '#f0f'
  context.fillRect(0, 0, 8, 8)
  context.fillRect(8, 8, 8, 8)

  const uvById: Record<string, [number, number, number, number]> = {}
  let cellX = 1
  let cellY = 0
  let rowHeight = 1
  for (const entry of entries) {
    if (cellX + entry.cellsX > side) {
      cellX = 1
      cellY += rowHeight
      rowHeight = 1
    }
    if (cellY + entry.cellsY > side) continue
    context.drawImage(entry.image, 0, 0, entry.width, entry.height, cellX * 16, cellY * 16, entry.width, entry.height)
    uvById[entry.id] = [cellX / side, cellY / side, (cellX + entry.cellsX) / side, (cellY + entry.cellsY) / side]
    cellX += entry.cellsX
    rowHeight = Math.max(rowHeight, entry.cellsY)
  }
  return new TextureAtlas(context.getImageData(0, 0, pixels, pixels), uvById)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** 将新版游戏模型中的纹理描述对象降级为当前 Deepslate 可读取的纹理标识。 */
export function normalizeBlockModelTextures(payload: unknown): unknown {
  if (!isRecord(payload)) return payload
  const normalized = { ...payload }
  if (!isRecord(payload.textures)) return normalized
  normalized.textures = Object.fromEntries(
    Object.entries(payload.textures).map(([name, reference]) => {
      if (typeof reference === 'string') return [name, reference]
      if (isRecord(reference) && typeof reference.sprite === 'string') return [name, reference.sprite]
      return [name, 'minecraft:missingno']
    })
  )
  return normalized
}

export async function buildSchematicResources(bundle: SchematicAssetsBundle): Promise<Resources> {
  const definitions: Record<string, BlockDefinition> = {}
  for (const [id, payload] of Object.entries(bundle.blockstates)) {
    try {
      definitions[id] = BlockDefinition.fromJson(payload)
    } catch {
      // 模组或跨版本的无效状态定义会由方块回退逻辑处理。
    }
  }
  const models: Record<string, BlockModel> = {}
  for (const [id, payload] of Object.entries(bundle.models)) {
    try {
      models[id] = BlockModel.fromJson(normalizeBlockModelTextures(payload))
    } catch {
      // 模型缺失时 deepslate 会使用缺失纹理，不让单个模型中断预览。
    }
  }
  const modelProvider = { getBlockModel: (id: Identifier): BlockModel | null => models[id.toString()] ?? null }
  for (const model of Object.values(models)) model.flatten(modelProvider)
  const atlas = await buildTextureAtlas(bundle)
  return {
    getBlockDefinition: (id) => definitions[id.toString()] ?? null,
    getBlockModel: (id) => models[id.toString()] ?? null,
    getTextureAtlas: () => atlas.getTextureAtlas(),
    getTextureUV: (id) => atlas.getTextureUV(id),
    getBlockFlags: blockFlags,
    getBlockProperties: () => null,
    getDefaultBlockProperties: () => null,
  }
}

export function computeWorldBox(data: SchematicPreviewData): WorldBox {
  if (!data.regions.length) return { minX: 0, minY: 0, minZ: 0, width: 1, height: 1, depth: 1 }
  let minX = Infinity
  let minY = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let maxZ = -Infinity
  for (const region of data.regions) {
    const [x = 0, y = 0, z = 0] = region.position
    const [width = 0, height = 0, depth = 0] = region.size
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    minZ = Math.min(minZ, z)
    maxX = Math.max(maxX, x + width - 1)
    maxY = Math.max(maxY, y + height - 1)
    maxZ = Math.max(maxZ, z + depth - 1)
  }
  return {
    minX,
    minY,
    minZ,
    width: Math.max(1, maxX - minX + 1),
    height: Math.max(1, maxY - minY + 1),
    depth: Math.max(1, maxZ - minZ + 1),
  }
}

function addRegionBlocks(
  structure: Structure,
  region: SchematicRegionData,
  box: WorldBox,
  bundle: SchematicAssetsBundle,
  visibleLayers: number,
  sampleEvery: number
): number {
  const [width = 0, height = 0, depth = 0] = region.size
  const [originX = 0, originY = 0, originZ = 0] = region.position
  if (!width || !height || !depth) return 0
  let renderedBlocks = 0
  for (let index = 0; index < region.indices.length; index += 1) {
    const paletteIndex = region.indices[index]
    const entry = paletteIndex === undefined ? undefined : region.palette[paletteIndex]
    if (!entry || isAir(entry.name)) continue
    const x = index % width
    const row = Math.floor(index / width)
    const z = row % depth
    const y = Math.floor(row / depth)
    const worldY = originY + y - box.minY
    if (worldY >= visibleLayers) continue
    if (sampleEvery > 1 && index % sampleEvery !== 0) continue
    const name = bundle.blockstates[entry.name] ? entry.name : fallbackBlock
    structure.addBlock([originX + x - box.minX, worldY, originZ + z - box.minZ], name, entry.properties)
    renderedBlocks += 1
  }
  return renderedBlocks
}

function countVisibleBlocks(data: SchematicPreviewData, visibleLayers: number, box: WorldBox): number {
  let total = 0
  for (const region of data.regions) {
    const [width = 0, , depth = 0] = region.size
    const [, originY = 0] = region.position
    if (!width || !depth) continue
    for (let index = 0; index < region.indices.length; index += 1) {
      const entry = region.palette[region.indices[index] ?? -1]
      const row = Math.floor(index / width)
      const y = Math.floor(row / depth)
      if (entry && !isAir(entry.name) && originY + y - box.minY < visibleLayers) total += 1
    }
  }
  return total
}

export function buildSchematicPreview(
  data: SchematicPreviewData,
  bundle: SchematicAssetsBundle,
  box: WorldBox,
  visibleLayers = box.height,
  detailLimit = maxDetailedBlocks
): { structure: Structure; stats: SchematicRenderStats } {
  const totalBlocks = countVisibleBlocks(data, visibleLayers, box)
  const sampleEvery = Math.max(1, Math.ceil(totalBlocks / Math.max(1, detailLimit)))
  const structure = new Structure([box.width, box.height, box.depth])
  let renderedBlocks = 0
  for (const region of data.regions)
    renderedBlocks += addRegionBlocks(structure, region, box, bundle, visibleLayers, sampleEvery)
  return { structure, stats: { totalBlocks, renderedBlocks, simplified: sampleEvery > 1 } }
}

export function buildSchematicStructure(
  data: SchematicPreviewData,
  bundle: SchematicAssetsBundle,
  box: WorldBox,
  visibleLayers = box.height
): Structure {
  return buildSchematicPreview(data, bundle, box, visibleLayers, Number.MAX_SAFE_INTEGER).structure
}

export class SchematicStructureViewer {
  private readonly canvas: HTMLCanvasElement
  private readonly gl: WebGLRenderingContext
  private readonly data: SchematicPreviewData
  private readonly bundle: SchematicAssetsBundle
  private readonly resources: Resources
  private readonly box: WorldBox
  private readonly removers: Array<() => void> = []
  private renderer: StructureRenderer | null = null
  private readonly cameraPosition = vec3.create()
  private yaw = 0.5
  private pitch = 0.8
  private renderStats: SchematicRenderStats = { totalBlocks: 0, renderedBlocks: 0, simplified: false }
  private animationFrame = 0
  private disposed = false

  constructor(
    canvas: HTMLCanvasElement,
    data: SchematicPreviewData,
    bundle: SchematicAssetsBundle,
    resources: Resources
  ) {
    const gl = canvas.getContext('webgl', { antialias: true, alpha: false })
    if (!gl) throw new Error('当前设备不支持 WebGL 原理图预览')
    this.canvas = canvas
    this.gl = gl
    this.data = data
    this.bundle = bundle
    this.resources = resources
    this.box = computeWorldBox(data)
    this.resetView()
    this.setVisibleLayers(this.box.height)
    this.bindControls()
    this.drawLoop()
  }

  setVisibleLayers(value: number): void {
    const preview = buildSchematicPreview(this.data, this.bundle, this.box, Math.max(1, value))
    this.renderStats = preview.stats
    if (this.renderer) {
      // setStructure 内部已重建缓冲；重复调用会把大型原理图的主线程开销翻倍。
      this.renderer.setStructure(preview.structure)
      return
    }
    this.renderer = new StructureRenderer(this.gl, preview.structure, this.resources, { chunkSize: 8 })
    this.resize()
  }

  getRenderStats(): SchematicRenderStats {
    return this.renderStats
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect()
    const width = Math.max(1, Math.round(rect.width * Math.min(window.devicePixelRatio, 2)))
    const height = Math.max(1, Math.round(rect.height * Math.min(window.devicePixelRatio, 2)))
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
    }
    this.renderer?.setViewport(0, 0, width, height)
  }

  rotate(direction: -1 | 1): void {
    this.yaw += direction * (Math.PI / 8)
  }

  resetView(): void {
    vec3.set(this.cameraPosition, -this.box.width / 2, -this.box.height / 2, -this.box.depth / 2)
    this.yaw = 0.5
    this.pitch = 0.8
  }

  dispose(): void {
    this.disposed = true
    cancelAnimationFrame(this.animationFrame)
    for (const remove of this.removers) remove()
    this.renderer = null
  }

  private drawLoop = (): void => {
    if (this.disposed) return
    const renderer = this.renderer
    if (renderer) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
      this.gl.clearColor(0.07, 0.08, 0.11, 1)
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
      const view = mat4.create()
      mat4.rotateX(view, view, this.pitch)
      mat4.rotateY(view, view, this.yaw)
      mat4.translate(view, view, this.cameraPosition)
      renderer.drawStructure(view)
      renderer.drawGrid(view)
    }
    this.animationFrame = requestAnimationFrame(this.drawLoop)
  }

  private bindControls(): void {
    let panStart: [number, number] | null = null
    let rotateStart: [number, number] | null = null
    const onMouseDown = (event: MouseEvent): void => {
      if (event.button === 0) panStart = [event.clientX, event.clientY]
      if (event.button === 1) {
        event.preventDefault()
        rotateStart = [event.clientX, event.clientY]
      }
    }
    const onMouseMove = (event: MouseEvent): void => {
      if (rotateStart) {
        this.yaw += (event.clientX - rotateStart[0]) / 200
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch + (event.clientY - rotateStart[1]) / 200))
        rotateStart = [event.clientX, event.clientY]
      } else if (panStart) {
        const offset = vec3.fromValues((event.clientX - panStart[0]) / 90, (panStart[1] - event.clientY) / 90, 0)
        vec3.rotateX(offset, offset, [0, 0, 0], -this.pitch)
        vec3.rotateY(offset, offset, [0, 0, 0], -this.yaw)
        vec3.add(this.cameraPosition, this.cameraPosition, offset)
        panStart = [event.clientX, event.clientY]
      }
    }
    const onMouseUp = (): void => {
      panStart = null
      rotateStart = null
    }
    const onWheel = (event: WheelEvent): void => {
      event.preventDefault()
      const offset = vec3.fromValues(0, 0, -event.deltaY / 180)
      vec3.rotateX(offset, offset, [0, 0, 0], -this.pitch)
      vec3.rotateY(offset, offset, [0, 0, 0], -this.yaw)
      vec3.add(this.cameraPosition, this.cameraPosition, offset)
    }
    const preventMenu = (event: MouseEvent): void => event.preventDefault()
    this.canvas.addEventListener('mousedown', onMouseDown)
    this.canvas.addEventListener('mousemove', onMouseMove)
    this.canvas.addEventListener('mouseup', onMouseUp)
    this.canvas.addEventListener('mouseleave', onMouseUp)
    this.canvas.addEventListener('wheel', onWheel, { passive: false })
    this.canvas.addEventListener('contextmenu', preventMenu)
    this.removers.push(
      () => this.canvas.removeEventListener('mousedown', onMouseDown),
      () => this.canvas.removeEventListener('mousemove', onMouseMove),
      () => this.canvas.removeEventListener('mouseup', onMouseUp),
      () => this.canvas.removeEventListener('mouseleave', onMouseUp),
      () => this.canvas.removeEventListener('wheel', onWheel),
      () => this.canvas.removeEventListener('contextmenu', preventMenu)
    )
  }
}
