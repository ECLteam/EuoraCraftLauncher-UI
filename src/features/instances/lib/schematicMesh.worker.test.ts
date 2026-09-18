import { afterEach, describe, expect, it, vi } from 'vitest'

type WorkerScope = {
  onmessage: ((event: { data: unknown }) => void) | null
  postMessage: ReturnType<typeof vi.fn>
}

function encodedChunk(localX: number): string {
  const indices = new Uint16Array(16 ** 3)
  indices[localX] = 1
  return btoa(String.fromCharCode(...new Uint8Array(indices.buffer)))
}

afterEach(() => vi.unstubAllGlobals())

describe('schematicMesh.worker', () => {
  it('按模型纹理生成跨区块相邻方块的十个外面', async () => {
    const scope: WorkerScope = { onmessage: null, postMessage: vi.fn() }
    vi.stubGlobal('self', scope)
    await import('./schematicMesh.worker')
    const send = (data: unknown) => scope.onmessage?.({ data })
    send({
      type: 'init',
      palette: [
        { name: 'minecraft:air', properties: {}, color: [0, 0, 0] },
        { name: 'minecraft:stone', properties: {}, color: [128, 128, 128] },
      ],
      assets: {
        blockstates: { 'minecraft:stone': { variants: { '': { model: 'minecraft:block/stone' } } } },
        models: {
          'minecraft:block/stone': { parent: 'minecraft:block/cube_all', textures: { all: 'minecraft:block/stone' } },
          'minecraft:block/cube_all': {
            parent: 'minecraft:block/cube',
            textures: Object.fromEntries(
              ['up', 'down', 'north', 'south', 'east', 'west'].map((name) => [name, '#all'])
            ),
          },
          'minecraft:block/cube': {
            elements: [
              {
                from: [0, 0, 0],
                to: [16, 16, 16],
                faces: Object.fromEntries(
                  ['up', 'down', 'north', 'south', 'east', 'west'].map((name) => [
                    name,
                    { texture: `#${name}`, cullface: name },
                  ])
                ),
              },
            ],
          },
        },
      },
      uvById: { 'minecraft:block/stone': [0, 0, 1, 1], 'minecraft:missingno': [0, 0, 1, 1] },
      chunks: [
        [0, 0, 0],
        [1, 0, 0],
      ],
      size: [32, 1, 1],
      chunkSize: 16,
    })
    send({
      type: 'desired',
      coords: [
        [0, 0, 0],
        [1, 0, 0],
      ],
    })
    send({
      type: 'chunks',
      chunks: [
        { coord: [0, 0, 0], indices: encodedChunk(15) },
        { coord: [1, 0, 0], indices: encodedChunk(0) },
      ],
    })
    await vi.waitFor(() => {
      expect(scope.postMessage.mock.calls.filter(([message]) => message.type === 'mesh')).toHaveLength(2)
    })
    const meshes = scope.postMessage.mock.calls.map(([message]) => message).filter((message) => message.type === 'mesh')
    expect(meshes.reduce((total, mesh) => total + mesh.opaque.positions.length, 0)).toBe(10 * 6 * 3)
    expect(meshes.every((mesh) => mesh.transparent.positions.length === 0)).toBe(true)
  })
})
