import {
  BlockDefinition,
  BlockModel,
  Identifier,
  Structure,
  StructureRenderer,
  TextureAtlas,
  type BlockFlags,
  type Resources,
} from 'deepslate'
import { mat4, vec3 } from 'gl-matrix'
import {
  BoxGeometry,
  Color,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  NearestFilter,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  WebGLRenderer,
} from 'three'
import type { SchematicAssetsBundle, SchematicPreviewData, SchematicRegionData } from '@/types/api'

const fallbackBlock = 'minecraft:stone'

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
  'redstone',
]

export interface WorldBox {
  minX: number
  minY: number
  minZ: number
  width: number
  height: number
  depth: number
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

export function needsDetailedModel(name: string): boolean {
  const blockName = name.split(':').at(-1) ?? ''
  return (
    nonSolidKeywords.some((keyword) => blockName.includes(keyword)) ||
    ['glass', 'leaves', 'water', 'lava', 'ice', 'portal'].some((keyword) => blockName.includes(keyword))
  )
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

export async function buildSchematicAtlas(bundle: SchematicAssetsBundle): Promise<{
  image: ImageData
  uvById: Record<string, [number, number, number, number]>
}> {
  const atlas = await buildTextureAtlas(bundle)
  const uvById: Record<string, [number, number, number, number]> = {}
  for (const id of Object.keys(bundle.textures)) uvById[id] = atlas.getTextureUV(Identifier.parse(id))
  uvById['minecraft:missingno'] = atlas.getTextureUV(Identifier.parse('minecraft:missingno'))
  return { image: atlas.getTextureAtlas(), uvById }
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
  include: (name: string) => boolean
): void {
  const [width = 0, height = 0, depth = 0] = region.size
  const [originX = 0, originY = 0, originZ = 0] = region.position
  if (!width || !height || !depth) return
  for (let index = 0; index < region.indices.length; index += 1) {
    const paletteIndex = region.indices[index]
    const entry = paletteIndex === undefined ? undefined : region.palette[paletteIndex]
    if (!entry || isAir(entry.name) || !include(entry.name)) continue
    const x = index % width
    const row = Math.floor(index / width)
    const z = row % depth
    const y = Math.floor(row / depth)
    const worldY = originY + y - box.minY
    if (worldY >= visibleLayers) continue
    const name = bundle.blockstates[entry.name] ? entry.name : fallbackBlock
    structure.addBlock([originX + x - box.minX, worldY, originZ + z - box.minZ], name, entry.properties)
  }
}

function buildFilteredStructure(
  data: SchematicPreviewData,
  bundle: SchematicAssetsBundle,
  box: WorldBox,
  visibleLayers = box.height,
  include: (name: string) => boolean = () => true
): Structure {
  const structure = new Structure([box.width, box.height, box.depth])
  for (const region of data.regions) addRegionBlocks(structure, region, box, bundle, visibleLayers, include)
  return structure
}

export function buildSchematicStructure(
  data: SchematicPreviewData,
  bundle: SchematicAssetsBundle,
  box: WorldBox,
  visibleLayers = box.height
): Structure {
  return buildFilteredStructure(data, bundle, box, visibleLayers)
}

function buildDetailedStructure(
  data: SchematicPreviewData,
  bundle: SchematicAssetsBundle,
  box: WorldBox,
  visibleLayers: number
): Structure {
  return buildFilteredStructure(data, bundle, box, visibleLayers, needsDetailedModel)
}

type CubeEntry = { color: [number, number, number]; position: [number, number, number] }

function modelReference(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = modelReference(item)
      if (found) return found
    }
    return null
  }
  if (!isRecord(value)) return null
  if (typeof value.model === 'string') return value.model
  for (const item of Object.values(value)) {
    const found = modelReference(item)
    if (found) return found
  }
  return null
}

export function schematicBlockTextureId(bundle: SchematicAssetsBundle, block: string): string | null {
  const model = modelReference(bundle.blockstates[block])
  if (!model) return null
  let modelId = model.includes(':') ? model : `minecraft:${model}`
  const visited = new Set<string>()
  while (!visited.has(modelId)) {
    visited.add(modelId)
    const payload = bundle.models[modelId]
    if (!isRecord(payload)) return null
    if (isRecord(payload.textures)) {
      for (const reference of Object.values(payload.textures)) {
        const sprite = isRecord(reference) ? reference.sprite : reference
        if (typeof sprite === 'string' && !sprite.startsWith('#'))
          return sprite.includes(':') ? sprite : `minecraft:${sprite}`
      }
    }
    if (typeof payload.parent !== 'string') return null
    modelId = payload.parent.includes(':') ? payload.parent : `minecraft:${payload.parent}`
  }
  return null
}

class LightweightCubeRenderer {
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(70, 1, 0.1, 500)
  private readonly geometry = new BoxGeometry(1, 1, 1)
  private readonly root = new Scene()
  private readonly textureById = new Map<string, Texture>()

  constructor(
    canvas: HTMLCanvasElement,
    private readonly data: SchematicPreviewData,
    private readonly bundle: SchematicAssetsBundle,
    private readonly box: WorldBox
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.sortObjects = false
    this.camera.matrixAutoUpdate = false
    this.scene.add(this.root)
  }

  setVisibleLayers(visibleLayers: number): void {
    this.clearMeshes()
    const groups = new Map<string, CubeEntry[]>()
    for (const region of this.data.regions) {
      const [width = 0, height = 0, depth = 0] = region.size
      const [originX = 0, originY = 0, originZ = 0] = region.position
      if (!width || !height || !depth) continue
      for (let index = 0; index < region.indices.length; index += 1) {
        const entry = region.palette[region.indices[index] ?? -1]
        if (!entry || isAir(entry.name) || needsDetailedModel(entry.name)) continue
        const x = index % width
        const row = Math.floor(index / width)
        const z = row % depth
        const y = Math.floor(row / depth)
        const worldY = originY + y - this.box.minY
        if (worldY >= visibleLayers) continue
        const entries = groups.get(entry.name) ?? []
        entries.push({
          position: [originX + x - this.box.minX + 0.5, worldY + 0.5, originZ + z - this.box.minZ + 0.5],
          color: entry.color,
        })
        groups.set(entry.name, entries)
      }
    }
    const matrix = new Matrix4()
    for (const [block, entries] of groups) {
      const mesh = new InstancedMesh(
        this.geometry,
        new MeshBasicMaterial({ map: this.textureForBlock(block), color: new Color(...entries[0]!.color) }),
        entries.length
      )
      for (const [index, entry] of entries.entries()) {
        matrix.makeTranslation(...entry.position)
        mesh.setMatrixAt(index, matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
      this.root.add(mesh)
    }
  }

  resize(width: number, height: number): void {
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  render(view: mat4): void {
    this.camera.matrixWorldInverse.fromArray(view)
    this.camera.matrixWorld.copy(this.camera.matrixWorldInverse).invert()
    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    this.clearMeshes()
    this.geometry.dispose()
    this.textureById.forEach((texture) => texture.dispose())
    this.renderer.dispose()
  }

  private textureForBlock(block: string): Texture | null {
    const textureId = schematicBlockTextureId(this.bundle, block)
    if (!textureId) return null
    const cached = this.textureById.get(textureId)
    if (cached) return cached
    const encoded = this.bundle.textures[textureId]
    if (!encoded) return null
    const texture = new TextureLoader().load(`data:image/png;base64,${encoded}`)
    texture.magFilter = NearestFilter
    texture.minFilter = NearestFilter
    texture.colorSpace = SRGBColorSpace
    this.textureById.set(textureId, texture)
    return texture
  }

  private clearMeshes(): void {
    for (const child of this.root.children) {
      const material = (child as InstancedMesh).material
      if (Array.isArray(material)) material.forEach((item) => item.dispose())
      else material.dispose()
    }
    this.root.clear()
  }
}

export class SchematicStructureViewer {
  private readonly canvas: HTMLCanvasElement
  private readonly cubeRenderer: LightweightCubeRenderer
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
  private animationFrame = 0
  private disposed = false

  constructor(
    canvas: HTMLCanvasElement,
    cubeCanvas: HTMLCanvasElement,
    data: SchematicPreviewData,
    bundle: SchematicAssetsBundle,
    resources: Resources
  ) {
    const gl = canvas.getContext('webgl', { antialias: true, alpha: true })
    if (!gl) throw new Error('当前设备不支持 WebGL 原理图预览')
    this.canvas = canvas
    this.gl = gl
    this.data = data
    this.bundle = bundle
    this.resources = resources
    this.box = computeWorldBox(data)
    this.cubeRenderer = new LightweightCubeRenderer(cubeCanvas, data, bundle, this.box)
    this.resetView()
    this.setVisibleLayers(this.box.height)
    this.bindControls()
    this.drawLoop()
  }

  setVisibleLayers(value: number): void {
    const visibleLayers = Math.max(1, value)
    this.cubeRenderer.setVisibleLayers(visibleLayers)
    const structure = buildDetailedStructure(this.data, this.bundle, this.box, visibleLayers)
    if (this.renderer) {
      // setStructure 内部已重建缓冲；重复调用会把大型原理图的主线程开销翻倍。
      this.renderer.setStructure(structure)
      return
    }
    this.renderer = new StructureRenderer(this.gl, structure, this.resources, { chunkSize: 8 })
    this.resize()
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect()
    const width = Math.max(1, Math.round(rect.width * Math.min(window.devicePixelRatio, 2)))
    const height = Math.max(1, Math.round(rect.height * Math.min(window.devicePixelRatio, 2)))
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
    }
    this.cubeRenderer.resize(width, height)
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
    this.cubeRenderer.dispose()
    this.renderer = null
  }

  private drawLoop = (): void => {
    if (this.disposed) return
    const renderer = this.renderer
    if (renderer) {
      const view = mat4.create()
      mat4.rotateX(view, view, this.pitch)
      mat4.rotateY(view, view, this.yaw)
      mat4.translate(view, view, this.cameraPosition)
      this.cubeRenderer.render(view)
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
      this.gl.clearColor(0.07, 0.08, 0.11, 0)
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
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
