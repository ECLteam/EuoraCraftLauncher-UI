import { Structure, StructureRenderer, type Resources } from 'deepslate'
import { mat4, vec3 } from 'gl-matrix'
import type { SchematicAssetsBundle, SchematicPaletteEntry } from '@/types/api'
import { buildSchematicResources } from './schematicStructureRenderer'

const thumbnailSize = 48

export function schematicThumbnailEntries(entries: readonly SchematicPaletteEntry[]): SchematicPaletteEntry[] {
  const entryByName = new Map<string, SchematicPaletteEntry>()
  for (const entry of entries) {
    if (entry.name.endsWith(':air') || entryByName.has(entry.name)) continue
    entryByName.set(entry.name, entry)
  }
  return [...entryByName.values()]
}

export class SchematicMaterialThumbnailRenderer {
  private readonly canvas = document.createElement('canvas')
  private readonly gl: WebGLRenderingContext
  private readonly view = mat4.create()
  private resources: Resources | null = null
  private renderer: StructureRenderer | null = null
  private queue: SchematicPaletteEntry[] = []
  private animationFrame = 0
  private disposed = false

  constructor(
    private readonly bundle: SchematicAssetsBundle,
    private readonly onThumbnail: (name: string, source: string | null) => void
  ) {
    this.canvas.width = thumbnailSize
    this.canvas.height = thumbnailSize
    this.canvas.style.cssText =
      `position:fixed;left:-${thumbnailSize}px;top:-${thumbnailSize}px;width:${thumbnailSize}px;height:${thumbnailSize}px;` +
      'opacity:0;pointer-events:none;'
    document.body.append(this.canvas)
    const gl = this.canvas.getContext('webgl', { alpha: true, antialias: false, preserveDrawingBuffer: true })
    if (!gl) {
      this.canvas.remove()
      throw new Error('当前设备不支持方块缩略图渲染')
    }
    this.gl = gl
    mat4.lookAt(this.view, vec3.fromValues(2.4, 2.2, 2.4), vec3.fromValues(0.5, 0.5, 0.5), vec3.fromValues(0, 1, 0))
  }

  async start(entries: readonly SchematicPaletteEntry[]): Promise<void> {
    this.resources = await buildSchematicResources(this.bundle)
    if (this.disposed) return
    this.queue = schematicThumbnailEntries(entries)
    this.renderNext()
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    cancelAnimationFrame(this.animationFrame)
    this.renderer = null
    this.gl.getExtension('WEBGL_lose_context')?.loseContext()
    this.canvas.remove()
  }

  private renderNext = (): void => {
    if (this.disposed) return
    const entry = this.queue.shift()
    if (!entry || !this.resources) return
    try {
      const structure = new Structure([1, 1, 1])
      structure.addBlock([0, 0, 0], entry.name, entry.properties)
      if (this.renderer) this.renderer.setStructure(structure)
      else {
        this.renderer = new StructureRenderer(this.gl, structure, this.resources, {
          chunkSize: 1,
          useInvisibleBlockBuffer: false,
        })
        this.renderer.setViewport(0, 0, thumbnailSize, thumbnailSize)
      }
      this.gl.viewport(0, 0, thumbnailSize, thumbnailSize)
      this.gl.clearColor(0, 0, 0, 0)
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
      this.renderer.drawStructure(this.view)
      this.onThumbnail(entry.name, this.hasVisiblePixels() ? this.canvas.toDataURL('image/png') : null)
    } catch {
      this.onThumbnail(entry.name, null)
    }
    this.animationFrame = requestAnimationFrame(this.renderNext)
  }

  private hasVisiblePixels(): boolean {
    const pixels = new Uint8Array(thumbnailSize * thumbnailSize * 4)
    this.gl.readPixels(0, 0, thumbnailSize, thumbnailSize, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels)
    for (let index = 3; index < pixels.length; index += 4) if (pixels[index] !== 0) return true
    return false
  }
}
