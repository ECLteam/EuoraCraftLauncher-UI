import { describe, expect, it } from 'vitest'
import { blockCullMask, faceDirections, type BlockCoord } from './schematicFaceCulling'

function occupancy(blocks: Array<{ position: BlockCoord; id: number }>, layers = Infinity) {
  const byPosition = new Map(blocks.map(({ position, id }) => [position.join(','), id]))
  return (x: number, y: number, z: number) => (y < layers ? (byPosition.get([x, y, z].join(',')) ?? 0) : 0)
}

function visibleFaces(blocks: Array<{ position: BlockCoord; id: number }>, layers = Infinity): number {
  const at = occupancy(blocks, layers)
  return blocks.reduce((total, block) => {
    if (block.position[1] >= layers) return total
    const mask = blockCullMask(block.position, block.id, at, [false, true], false)
    return total + faceDirections.filter(({ name }) => !mask[name]).length
  }, 0)
}

describe('schematicFaceCulling', () => {
  it('跨 16 格区块边界的相邻完整方块只留下十个外面', () => {
    expect(
      visibleFaces([
        { position: [15, 0, 0], id: 1 },
        { position: [16, 0, 0], id: 1 },
      ])
    ).toBe(10)
  })

  it('实心体只保留外表面，切片后重新露出顶面', () => {
    const blocks = Array.from({ length: 8 }, (_, index) => ({
      position: [index % 2, Math.floor(index / 4), Math.floor(index / 2) % 2] as BlockCoord,
      id: 1,
    }))
    expect(visibleFaces(blocks)).toBe(24)
    expect(visibleFaces(blocks, 1)).toBe(16)
  })

  it('透明块仅自剔同种块，未知非完整块不遮住邻面', () => {
    const at = occupancy([
      { position: [0, 0, 0], id: 2 },
      { position: [1, 0, 0], id: 2 },
    ])
    expect(blockCullMask([0, 0, 0], 2, at, [false, true, false], true).east).toBe(true)
    expect(blockCullMask([0, 0, 0], 2, at, [false, true, false], false).east).toBe(false)
  })
})
