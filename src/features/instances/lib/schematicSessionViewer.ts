import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  DataTexture,
  DirectionalLight,
  DoubleSide,
  Frustum,
  HemisphereLight,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  NearestFilter,
  PerspectiveCamera,
  Scene,
  Sphere,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three'
import { toRaw } from 'vue'
import { instanceWorkspaceApi } from '@/features/instances/api/instanceWorkspaceApi'
import type { SchematicAssetsBundle, SchematicSessionData } from '@/types/api'

type Coord = [number, number, number]
type GeometryData = { positions: Float32Array; colors: Float32Array; uvs: Float32Array; normals: Float32Array }
type MeshMessage = { type: 'mesh'; coord: Coord; layers: number; opaque: GeometryData; transparent: GeometryData }
type WorkerReply = MeshMessage | { type: 'ready' }

function key(coord: Coord): string {
  return coord.join(',')
}

function neighbors(coord: Coord): Coord[] {
  return [
    [coord[0] - 1, coord[1], coord[2]],
    [coord[0] + 1, coord[1], coord[2]],
    [coord[0], coord[1] - 1, coord[2]],
    [coord[0], coord[1] + 1, coord[2]],
    [coord[0], coord[1], coord[2] - 1],
    [coord[0], coord[1], coord[2] + 1],
  ]
}

export function addSchematicLighting(scene: Scene, size: Coord): void {
  const fill = new HemisphereLight(0xe8f1ff, 0x4a4236, 1.35)
  const keyLight = new DirectionalLight(0xfff0d8, 1.2)
  keyLight.position.set(size[0] * 0.7 + 12, size[1] * 1.4 + 24, size[2] * 0.45 + 16)
  keyLight.target.position.set(size[0] / 2, size[1] / 2, size[2] / 2)
  scene.add(fill, keyLight, keyLight.target)
}

export function schematicDistanceRange(size: Coord): { min: number; max: number } {
  const diagonal = new Vector3(...size).length()
  return { min: Math.max(1.5, diagonal * 0.05), max: Math.max(12, diagonal * 3) }
}

export function schematicZoomDistance(distance: number, deltaY: number, min: number, max: number): number {
  const normalizedDelta = Math.max(-120, Math.min(120, deltaY))
  return Math.max(min, Math.min(max, distance * Math.exp(normalizedDelta * 0.0015)))
}

export function schematicWorkerInitPayload(
  session: SchematicSessionData,
  assets: SchematicAssetsBundle,
  uvById: Record<string, [number, number, number, number]>
) {
  const rawSession = toRaw(session)
  const rawAssets = toRaw(assets)
  return {
    type: 'init' as const,
    palette: rawSession.palette,
    assets: { blockstates: rawAssets.blockstates, models: rawAssets.models },
    uvById,
    chunks: rawSession.chunks,
    size: rawSession.size,
    chunkSize: rawSession.chunkSize,
  }
}

export class SchematicSessionViewer {
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera: PerspectiveCamera
  private readonly worker: Worker
  private readonly texture: DataTexture
  private readonly opaqueMaterial: MeshLambertMaterial
  private readonly transparentMaterial: MeshBasicMaterial
  private readonly allChunkCoords = new Map<string, Coord>()
  private readonly requested = new Set<string>()
  private readonly loaded = new Set<string>()
  private readonly needed = new Set<string>()
  private fetchOrder: Coord[] = []
  private readonly desired = new Set<string>()
  private readonly meshes = new Map<string, Mesh[]>()
  private readonly pendingMeshes: MeshMessage[] = []
  private readonly removers: Array<() => void> = []
  private readonly target: Vector3
  private readonly box = new Box3()
  private readonly frustum = new Frustum()
  private readonly projection = new Matrix4()
  private animationFrame = 0
  private lastDesiredUpdate = 0
  private activeFetches = 0
  private disposed = false
  private workerReady = false
  private needsRender = true
  private needsDesiredUpdate = true
  private yaw = 0.6
  private pitch = 0.45
  private distance: number
  private visibleLayers: number

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly session: SchematicSessionData,
    assets: SchematicAssetsBundle,
    atlas: { image: ImageData; uvById: Record<string, [number, number, number, number]> },
    private readonly onProgress: (loaded: number, total: number) => void,
    private readonly onError: (message: string) => void
  ) {
    this.renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.sortObjects = true
    this.camera = new PerspectiveCamera(65, 1, 0.1, Math.max(...session.size) * 10 + 100)
    this.target = new Vector3(session.size[0] / 2, session.size[1] / 2, session.size[2] / 2)
    this.distance = Math.max(4, new Vector3(...session.size).length() * 0.95)
    this.visibleLayers = session.size[1]
    this.texture = new DataTexture(atlas.image.data, atlas.image.width, atlas.image.height)
    this.texture.magFilter = NearestFilter
    this.texture.minFilter = NearestFilter
    this.texture.generateMipmaps = false
    this.texture.colorSpace = SRGBColorSpace
    this.texture.needsUpdate = true
    this.opaqueMaterial = new MeshLambertMaterial({ map: this.texture, vertexColors: true, alphaTest: 0.1 })
    this.transparentMaterial = new MeshBasicMaterial({
      map: this.texture,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    })
    addSchematicLighting(this.scene, session.size)
    for (const coord of toRaw(session).chunks) this.allChunkCoords.set(key(coord), coord)
    this.worker = new Worker(new URL('./schematicMesh.worker.ts', import.meta.url), { type: 'module' })
    this.worker.onmessage = (event: MessageEvent<WorkerReply>) => {
      if (this.disposed) return
      if (event.data.type === 'ready') {
        this.workerReady = true
        this.updateDesired(true)
      } else this.pendingMeshes.push(event.data)
    }
    this.worker.onerror = () => this.onError('原理图网格构建失败，请重新打开预览')
    this.worker.postMessage(schematicWorkerInitPayload(session, assets, atlas.uvById))
    this.bindControls()
    this.resize()
    this.updateCamera()
    this.drawLoop()
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect()
    const width = Math.max(1, Math.round(rect.width * Math.min(window.devicePixelRatio, 2)))
    const height = Math.max(1, Math.round(rect.height * Math.min(window.devicePixelRatio, 2)))
    if (this.canvas.width !== width || this.canvas.height !== height) this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.needsRender = true
    this.needsDesiredUpdate = true
    this.updateDesired(true)
  }

  rotate(direction: -1 | 1): void {
    this.yaw += direction * (Math.PI / 8)
    this.updateCamera()
  }

  resetView(): void {
    this.target.set(this.session.size[0] / 2, this.session.size[1] / 2, this.session.size[2] / 2)
    this.distance = Math.max(4, new Vector3(...this.session.size).length() * 0.95)
    this.yaw = 0.6
    this.pitch = 0.45
    this.updateCamera()
  }

  setVisibleLayers(value: number): void {
    const previous = this.visibleLayers
    this.visibleLayers = Math.max(1, Math.min(this.session.size[1], value))
    this.worker.postMessage({ type: 'layers', value: this.visibleLayers })
    const oldBoundary = Math.floor((previous - 1) / this.session.chunkSize)
    const newBoundary = Math.floor((this.visibleLayers - 1) / this.session.chunkSize)
    for (const [chunkKey, meshes] of this.meshes) {
      const coord = this.allChunkCoords.get(chunkKey)!
      if (coord[1] === oldBoundary || coord[1] === newBoundary) {
        this.removeMeshes(chunkKey)
        continue
      }
      for (const mesh of meshes) mesh.visible = coord[1] * this.session.chunkSize < this.visibleLayers
    }
    this.needsRender = true
    this.needsDesiredUpdate = true
    this.updateDesired(true)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    cancelAnimationFrame(this.animationFrame)
    this.worker.terminate()
    for (const remove of this.removers) remove()
    for (const chunkKey of this.meshes.keys()) this.removeMeshes(chunkKey)
    this.pendingMeshes.length = 0
    this.opaqueMaterial.dispose()
    this.transparentMaterial.dispose()
    this.texture.dispose()
    this.renderer.dispose()
  }

  private updateCamera(): void {
    const horizontal = Math.cos(this.pitch) * this.distance
    this.camera.position.set(
      this.target.x + Math.sin(this.yaw) * horizontal,
      this.target.y + Math.sin(this.pitch) * this.distance,
      this.target.z + Math.cos(this.yaw) * horizontal
    )
    this.camera.lookAt(this.target)
    this.camera.updateMatrixWorld()
    this.needsRender = true
    this.needsDesiredUpdate = true
    this.updateDesired()
  }

  private updateDesired(force = false): void {
    if (!this.workerReady || this.disposed) return
    if (!force && !this.needsDesiredUpdate) return
    const now = performance.now()
    if (!force && now - this.lastDesiredUpdate < 100) return
    this.lastDesiredUpdate = now
    this.needsDesiredUpdate = false
    this.projection.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse)
    this.frustum.setFromProjectionMatrix(this.projection)
    const visible: Coord[] = []
    const needed = new Set<string>()
    const side = this.session.chunkSize
    for (const [chunkKey, coord] of this.allChunkCoords) {
      if (coord[1] * side >= this.visibleLayers) continue
      this.box.min.set(coord[0] * side, coord[1] * side, coord[2] * side)
      this.box.max.set((coord[0] + 1) * side, (coord[1] + 1) * side, (coord[2] + 1) * side)
      if (!this.frustum.intersectsBox(this.box)) continue
      visible.push(coord)
      needed.add(chunkKey)
      for (const neighbor of neighbors(coord)) {
        const neighborKey = key(neighbor)
        if (this.allChunkCoords.has(neighborKey)) needed.add(neighborKey)
      }
    }
    visible.sort((left, right) => this.chunkDistance(left) - this.chunkDistance(right))
    const nextDesired = new Set(visible.map(key))
    const fetchOrder: Coord[] = []
    const fetchKeys = new Set<string>()
    for (const coord of visible) {
      for (const candidate of [coord, ...neighbors(coord)]) {
        const candidateKey = key(candidate)
        if (needed.has(candidateKey) && !fetchKeys.has(candidateKey)) {
          fetchKeys.add(candidateKey)
          fetchOrder.push(candidate)
        }
      }
    }
    for (const chunkKey of this.desired) if (!nextDesired.has(chunkKey)) this.removeMeshes(chunkKey)
    this.desired.clear()
    for (const chunkKey of nextDesired) this.desired.add(chunkKey)
    this.needed.clear()
    for (const chunkKey of needed) this.needed.add(chunkKey)
    this.fetchOrder = fetchOrder
    this.worker.postMessage({ type: 'desired', coords: visible })
    this.fetchChunks()
  }

  private chunkDistance(coord: Coord): number {
    const side = this.session.chunkSize
    return this.camera.position.distanceToSquared(
      new Vector3((coord[0] + 0.5) * side, (coord[1] + 0.5) * side, (coord[2] + 0.5) * side)
    )
  }

  private fetchChunks(): void {
    if (this.disposed) return
    while (this.activeFetches < 2) {
      const coords: Coord[] = []
      for (const coord of this.fetchOrder) {
        const chunkKey = key(coord)
        if (this.needed.has(chunkKey) && !this.requested.has(chunkKey)) {
          this.requested.add(chunkKey)
          coords.push(coord)
        }
        if (coords.length === 24) break
      }
      if (!coords.length) break
      this.activeFetches += 1
      void instanceWorkspaceApi
        .schematicSessionChunks(this.session.sessionId, coords)
        .then((batch) => {
          if (this.disposed) return
          this.worker.postMessage({ type: 'chunks', chunks: batch.chunks })
          for (const chunk of batch.chunks) this.loaded.add(key(chunk.coord))
          this.onProgress(this.loaded.size, this.session.chunks.length)
        })
        .catch((error: unknown) => {
          if (!this.disposed) this.onError(error instanceof Error ? error.message : '原理图区块读取失败')
        })
        .finally(() => {
          this.activeFetches -= 1
          this.fetchChunks()
        })
    }
  }

  private removeMeshes(chunkKey: string): void {
    const meshes = this.meshes.get(chunkKey)
    if (!meshes) return
    for (const mesh of meshes) {
      this.scene.remove(mesh)
      mesh.geometry.dispose()
    }
    this.meshes.delete(chunkKey)
    this.needsRender = true
  }

  private uploadGeometry(coord: Coord, data: GeometryData, transparent: boolean): Mesh | null {
    if (!data.positions.length) return null
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(data.positions, 3))
    geometry.setAttribute('color', new BufferAttribute(data.colors, 3))
    geometry.setAttribute('uv', new BufferAttribute(data.uvs, 2))
    geometry.setAttribute('normal', new BufferAttribute(data.normals, 3))
    const side = this.session.chunkSize
    geometry.boundingSphere = new Sphere(
      new Vector3((coord[0] + 0.5) * side, (coord[1] + 0.5) * side, (coord[2] + 0.5) * side),
      Math.sqrt(3) * side
    )
    const mesh = new Mesh(geometry, transparent ? this.transparentMaterial : this.opaqueMaterial)
    mesh.frustumCulled = true
    mesh.visible = coord[1] * side < this.visibleLayers
    this.scene.add(mesh)
    return mesh
  }

  private drawLoop = (): void => {
    if (this.disposed) return
    const started = performance.now()
    while (this.pendingMeshes.length && performance.now() - started < 8) {
      const message = this.pendingMeshes.shift()!
      const chunkKey = key(message.coord)
      if (!this.desired.has(chunkKey)) continue
      const boundary = Math.floor((this.visibleLayers - 1) / this.session.chunkSize)
      if (message.coord[1] === boundary && message.layers !== this.visibleLayers) continue
      this.removeMeshes(chunkKey)
      const meshes = [
        this.uploadGeometry(message.coord, message.opaque, false),
        this.uploadGeometry(message.coord, message.transparent, true),
      ].filter((item): item is Mesh => item !== null)
      this.meshes.set(chunkKey, meshes)
      this.needsRender = true
    }
    this.updateDesired()
    if (this.needsRender) {
      this.renderer.render(this.scene, this.camera)
      this.needsRender = false
    }
    this.animationFrame = requestAnimationFrame(this.drawLoop)
  }

  private bindControls(): void {
    let interaction: { mode: 'pan' | 'rotate'; point: [number, number]; pointerId: number } | null = null
    const onDown = (event: PointerEvent): void => {
      const mode =
        event.button === 2 || (event.button === 0 && event.shiftKey) ? 'pan' : event.button === 0 ? 'rotate' : null
      if (!mode) return
      event.preventDefault()
      interaction = { mode, point: [event.clientX, event.clientY], pointerId: event.pointerId }
      this.canvas.setPointerCapture(event.pointerId)
    }
    const onMove = (event: PointerEvent): void => {
      if (!interaction || interaction.pointerId !== event.pointerId) return
      const [startX, startY] = interaction.point
      const deltaX = event.clientX - startX
      const deltaY = event.clientY - startY
      if (interaction.mode === 'rotate') {
        this.yaw -= (deltaX / Math.max(1, this.canvas.clientWidth)) * Math.PI * 2
        this.pitch = Math.max(
          -1.5,
          Math.min(1.5, this.pitch - (deltaY / Math.max(1, this.canvas.clientHeight)) * Math.PI)
        )
      } else {
        const scale =
          (2 * this.distance * Math.tan((this.camera.fov * Math.PI) / 360)) / Math.max(1, this.canvas.clientHeight)
        const right = new Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0)
        const up = new Vector3().setFromMatrixColumn(this.camera.matrixWorld, 1)
        this.target.addScaledVector(right, -deltaX * scale)
        this.target.addScaledVector(up, deltaY * scale)
      }
      interaction.point = [event.clientX, event.clientY]
      this.updateCamera()
    }
    const onUp = (event: PointerEvent): void => {
      if (!interaction || interaction.pointerId !== event.pointerId) return
      if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId)
      interaction = null
    }
    const onWheel = (event: WheelEvent): void => {
      event.preventDefault()
      const range = schematicDistanceRange(this.session.size)
      this.distance = schematicZoomDistance(this.distance, event.deltaY, range.min, range.max)
      this.updateCamera()
    }
    const onDoubleClick = (): void => this.resetView()
    const preventMenu = (event: MouseEvent): void => event.preventDefault()
    this.canvas.addEventListener('pointerdown', onDown)
    this.canvas.addEventListener('pointermove', onMove)
    this.canvas.addEventListener('pointerup', onUp)
    this.canvas.addEventListener('pointercancel', onUp)
    this.canvas.addEventListener('wheel', onWheel, { passive: false })
    this.canvas.addEventListener('dblclick', onDoubleClick)
    this.canvas.addEventListener('contextmenu', preventMenu)
    this.removers.push(
      () => this.canvas.removeEventListener('pointerdown', onDown),
      () => this.canvas.removeEventListener('pointermove', onMove),
      () => this.canvas.removeEventListener('pointerup', onUp),
      () => this.canvas.removeEventListener('pointercancel', onUp),
      () => this.canvas.removeEventListener('wheel', onWheel),
      () => this.canvas.removeEventListener('dblclick', onDoubleClick),
      () => this.canvas.removeEventListener('contextmenu', preventMenu)
    )
  }
}
