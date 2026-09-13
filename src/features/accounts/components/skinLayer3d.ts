type SkinPartName = 'head' | 'body' | 'rightArm' | 'leftArm' | 'rightLeg' | 'leftLeg'
type Face = 'top' | 'bottom' | 'left' | 'front' | 'right' | 'back'

interface SkinPartDefinition {
  name: SkinPartName
  u: number
  v: number
  width: number
  height: number
  depth: number
}

interface PixelColor {
  red: number
  green: number
  blue: number
  alpha: number
}

interface CompatibleGeometry {
  clone(): CompatibleGeometry
  scale(x: number, y: number, z: number): CompatibleGeometry
  dispose(): void
  parameters?: { width?: number; height?: number; depth?: number }
}

interface CompatibleMaterial {
  clone(): CompatibleMaterial
  dispose(): void
  map: unknown
  color: { setRGB(red: number, green: number, blue: number): void }
  transparent: boolean
  opacity: number
  alphaTest: number
  needsUpdate: boolean
}

interface CompatibleObject {
  parent: CompatibleObject | null
  add(object: CompatibleObject): void
  remove(object: CompatibleObject): void
  position: { set(x: number, y: number, z: number): void }
  scale: { x: number; y: number; z: number }
}

interface CompatibleMesh extends CompatibleObject {
  geometry: CompatibleGeometry
  material: CompatibleMaterial
}

type CompatibleMeshConstructor = new (geometry: CompatibleGeometry, material: CompatibleMaterial) => CompatibleMesh

type SkinLayerViewer = {
  skinCanvas: HTMLCanvasElement
  playerObject: {
    skin: {
      [partName in SkinPartName]: {
        outerLayer: unknown
      }
    }
  }
}

const voxelDepth = 0.5
const standardSkinSize = 64

function textureFaces(
  part: SkinPartDefinition
): Array<{ face: Face; u: number; v: number; width: number; height: number }> {
  const { u, v, width, height, depth } = part
  return [
    { face: 'top', u: u + depth, v, width, height: depth },
    { face: 'bottom', u: u + width + depth, v, width, height: depth },
    { face: 'left', u, v: v + depth, width: depth, height },
    { face: 'front', u: u + depth, v: v + depth, width, height },
    { face: 'right', u: u + width + depth, v: v + depth, width: depth, height },
    { face: 'back', u: u + width + depth * 2, v: v + depth, width, height },
  ]
}

function colorAt(pixels: Uint8ClampedArray, x: number, y: number): PixelColor {
  const offset = (y * standardSkinSize + x) * 4
  return {
    red: pixels[offset] ?? 0,
    green: pixels[offset + 1] ?? 0,
    blue: pixels[offset + 2] ?? 0,
    alpha: pixels[offset + 3] ?? 0,
  }
}

function positionVoxel(
  face: Face,
  column: number,
  row: number,
  width: number,
  height: number,
  depth: number
): { x: number; y: number; z: number } {
  const horizontal = -width / 2 + column + 0.5
  const vertical = height / 2 - row - 0.5
  const forward = depth / 2 + voxelDepth / 2

  switch (face) {
    case 'front':
      return { x: horizontal, y: vertical, z: forward }
    case 'back':
      return { x: -horizontal, y: vertical, z: -forward }
    case 'right':
      return { x: width / 2 + voxelDepth / 2, y: vertical, z: depth / 2 - column - 0.5 }
    case 'left':
      return { x: -width / 2 - voxelDepth / 2, y: vertical, z: -depth / 2 + column + 0.5 }
    case 'top':
      return { x: horizontal, y: height / 2 + voxelDepth / 2, z: -depth / 2 + row + 0.5 }
    case 'bottom':
      return { x: horizontal, y: -height / 2 - voxelDepth / 2, z: depth / 2 - row - 0.5 }
  }
}

function voxelDimensions(face: Face): { x: number; y: number; z: number } {
  if (face === 'left' || face === 'right') return { x: voxelDepth, y: 1, z: 1 }
  if (face === 'top' || face === 'bottom') return { x: 1, y: voxelDepth, z: 1 }
  return { x: 1, y: 1, z: voxelDepth }
}

function skinParts(model: 'classic' | 'slim'): SkinPartDefinition[] {
  const armWidth = model === 'slim' ? 3 : 4
  return [
    { name: 'head', u: 32, v: 0, width: 8, height: 8, depth: 8 },
    { name: 'body', u: 16, v: 32, width: 8, height: 12, depth: 4 },
    { name: 'rightArm', u: 40, v: 32, width: armWidth, height: 12, depth: 4 },
    { name: 'leftArm', u: 48, v: 48, width: armWidth, height: 12, depth: 4 },
    { name: 'rightLeg', u: 0, v: 32, width: 4, height: 12, depth: 4 },
    { name: 'leftLeg', u: 0, v: 48, width: 4, height: 12, depth: 4 },
  ]
}

function createVoxelGeometry(outerLayer: CompatibleMesh, face: Face): CompatibleGeometry {
  const dimensions = voxelDimensions(face)
  const source = outerLayer.geometry.parameters ?? {}
  const scale = outerLayer.scale
  return outerLayer.geometry
    .clone()
    .scale(
      dimensions.x / ((source.width ?? 1) * scale.x),
      dimensions.y / ((source.height ?? 1) * scale.y),
      dimensions.z / ((source.depth ?? 1) * scale.z)
    )
}

function createVoxelMaterial(outerLayer: CompatibleMesh, color: PixelColor): CompatibleMaterial {
  const material = outerLayer.material.clone()
  material.map = null
  material.color.setRGB(color.red / 255, color.green / 255, color.blue / 255)
  material.transparent = color.alpha < 255
  material.opacity = color.alpha / 255
  material.alphaTest = 0.01
  material.needsUpdate = true
  return material
}

/**
 * 为标准皮肤的第二层建立逐像素的挤出模型。
 *
 * 像素网格、材质与构造器均从 skinview3d 已创建的第二层网格派生，确保它们和
 * skinview3d 的渲染器使用同一份 Three.js 运行时，避免跨版本对象导致 WebGL 崩溃。
 */
export function createSkinLayer3d(viewer: SkinLayerViewer, model: 'classic' | 'slim'): { dispose: () => void } | null {
  const canvas = viewer.skinCanvas
  if (canvas.width !== standardSkinSize || canvas.height !== standardSkinSize) return null

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null

  const pixels = context.getImageData(0, 0, standardSkinSize, standardSkinSize).data
  const voxels: CompatibleMesh[] = []
  const geometries = new Map<string, CompatibleGeometry>()
  const materials = new Map<string, CompatibleMaterial>()

  for (const part of skinParts(model)) {
    const outerLayer = viewer.playerObject.skin[part.name].outerLayer as CompatibleMesh
    const meshConstructor = outerLayer.constructor as CompatibleMeshConstructor
    for (const textureFace of textureFaces(part)) {
      const geometryKey = `${part.name}-${textureFace.face}`
      const geometry = geometries.get(geometryKey) ?? createVoxelGeometry(outerLayer, textureFace.face)
      geometries.set(geometryKey, geometry)
      for (let row = 0; row < textureFace.height; row += 1) {
        for (let column = 0; column < textureFace.width; column += 1) {
          const color = colorAt(pixels, textureFace.u + column, textureFace.v + row)
          if (color.alpha === 0) continue
          const materialKey = `${color.red},${color.green},${color.blue},${color.alpha}`
          const material = materials.get(materialKey) ?? createVoxelMaterial(outerLayer, color)
          materials.set(materialKey, material)
          const voxel = new meshConstructor(geometry, material)
          const position = positionVoxel(textureFace.face, column, row, part.width, part.height, part.depth)
          voxel.position.set(
            position.x / outerLayer.scale.x,
            position.y / outerLayer.scale.y,
            position.z / outerLayer.scale.z
          )
          outerLayer.add(voxel)
          voxels.push(voxel)
        }
      }
    }
  }

  return {
    dispose: () => {
      for (const voxel of voxels) voxel.parent?.remove(voxel)
      for (const geometry of geometries.values()) geometry.dispose()
      for (const material of materials.values()) material.dispose()
    },
  }
}
