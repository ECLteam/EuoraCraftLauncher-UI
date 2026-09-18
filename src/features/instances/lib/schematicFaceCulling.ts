export type BlockCoord = [number, number, number]
export type FaceName = 'up' | 'down' | 'north' | 'south' | 'east' | 'west'

export const faceDirections: Array<{ name: FaceName; delta: BlockCoord }> = [
  { name: 'up', delta: [0, 1, 0] },
  { name: 'down', delta: [0, -1, 0] },
  { name: 'north', delta: [0, 0, -1] },
  { name: 'south', delta: [0, 0, 1] },
  { name: 'east', delta: [1, 0, 0] },
  { name: 'west', delta: [-1, 0, 0] },
]

/** 只剔除被完整不透明邻块挡住的面；同种透明方块可自剔面。 */
export function blockCullMask(
  position: BlockCoord,
  paletteIndex: number,
  blockAt: (x: number, y: number, z: number) => number,
  opaqueCubes: readonly boolean[],
  selfCull: boolean
): Record<FaceName, boolean> {
  const [x, y, z] = position
  const mask = {} as Record<FaceName, boolean>
  for (const { name, delta } of faceDirections) {
    const neighbor = blockAt(x + delta[0], y + delta[1], z + delta[2])
    mask[name] = Boolean(neighbor && (opaqueCubes[neighbor] || (selfCull && neighbor === paletteIndex)))
  }
  return mask
}
