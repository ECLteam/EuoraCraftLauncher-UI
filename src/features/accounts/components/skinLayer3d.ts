import { BoxGeometry, Group, Mesh, MeshStandardMaterial, type Object3D } from 'three'

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

type SkinLayerViewer = {
  skinCanvas: HTMLCanvasElement
  playerObject: {
    skin: {
      [partName in SkinPartName]: {
        outerLayer: { parent: unknown }
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

function geometryForFace(face: Face): BoxGeometry {
  if (face === 'left' || face === 'right') return new BoxGeometry(voxelDepth, 1, 1)
  if (face === 'top' || face === 'bottom') return new BoxGeometry(1, voxelDepth, 1)
  return new BoxGeometry(1, 1, voxelDepth)
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

/**
 * 为标准皮肤的第二层建立逐像素的挤出模型。
 *
 * 该实现只读取 64×64 皮肤的标准第二层区域。每个非透明像素都会成为一个
 * 有厚度的方块，挂在 skinview3d 对应肢体的动画节点下，因此会随现有动作转动。
 */
export function createSkinLayer3d(viewer: SkinLayerViewer, model: 'classic' | 'slim'): { dispose: () => void } | null {
  const canvas = viewer.skinCanvas
  if (canvas.width !== standardSkinSize || canvas.height !== standardSkinSize) return null

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null

  const pixels = context.getImageData(0, 0, standardSkinSize, standardSkinSize).data
  const partGroups: Group[] = []
  const geometries = new Map<Face, BoxGeometry>()
  const materials = new Map<string, MeshStandardMaterial>()

  for (const part of skinParts(model)) {
    const outerLayerParent = viewer.playerObject.skin[part.name].outerLayer.parent as Object3D | null
    if (!outerLayerParent) continue

    const partGroup = new Group()
    for (const textureFace of textureFaces(part)) {
      const geometry = geometries.get(textureFace.face) ?? geometryForFace(textureFace.face)
      geometries.set(textureFace.face, geometry)
      for (let row = 0; row < textureFace.height; row += 1) {
        for (let column = 0; column < textureFace.width; column += 1) {
          const color = colorAt(pixels, textureFace.u + column, textureFace.v + row)
          if (color.alpha === 0) continue
          const materialKey = `${color.red},${color.green},${color.blue},${color.alpha}`
          let material = materials.get(materialKey)
          if (!material) {
            material = new MeshStandardMaterial({
              color: `rgb(${color.red}, ${color.green}, ${color.blue})`,
              transparent: color.alpha < 255,
              opacity: color.alpha / 255,
              alphaTest: 0.01,
            })
            materials.set(materialKey, material)
          }
          const voxel = new Mesh(geometry, material)
          const position = positionVoxel(textureFace.face, column, row, part.width, part.height, part.depth)
          voxel.position.set(position.x, position.y, position.z)
          partGroup.add(voxel)
        }
      }
    }
    outerLayerParent.add(partGroup)
    partGroups.push(partGroup)
  }

  return {
    dispose: () => {
      for (const partGroup of partGroups) partGroup.parent?.remove(partGroup)
      for (const geometry of geometries.values()) geometry.dispose()
      for (const material of materials.values()) material.dispose()
    },
  }
}
