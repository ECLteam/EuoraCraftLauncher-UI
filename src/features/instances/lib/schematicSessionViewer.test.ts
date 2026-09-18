import { DirectionalLight, HemisphereLight, Scene } from 'three'
import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import type { SchematicAssetsBundle, SchematicSessionData } from '@/types/api'
import {
  addSchematicLighting,
  schematicDistanceRange,
  schematicWorkerInitPayload,
  schematicZoomDistance,
} from './schematicSessionViewer'

describe('schematicWorkerInitPayload', () => {
  it('从 Vue 响应式状态创建可发送给 Worker 的数据', () => {
    const session = reactive<SchematicSessionData>({
      sessionId: 'test-session',
      type: 'litematic',
      size: [16, 16, 16],
      chunkSize: 16,
      palette: [{ name: 'minecraft:stone', properties: {}, color: [128, 128, 128] }],
      materialCounts: { 'minecraft:stone': 1 },
      chunks: [[0, 0, 0]],
    })
    const assets = reactive<SchematicAssetsBundle>({
      blockstates: { 'minecraft:stone': { variants: {} } },
      models: { 'minecraft:block/stone': { textures: { all: 'minecraft:block/stone' } } },
      textures: {},
      animated: [],
      missingBlocks: [],
    })
    const payload = schematicWorkerInitPayload(session, assets, {})

    expect(() => structuredClone(payload)).not.toThrow()
    expect(() => structuredClone(payload.chunks[0])).not.toThrow()
  })

  it('为原理图场景配置固定的环境光和方向光', () => {
    const scene = new Scene()
    addSchematicLighting(scene, [32, 16, 48])

    expect(scene.children.some((child) => child instanceof HemisphereLight)).toBe(true)
    const keyLight = scene.children.find((child): child is DirectionalLight => child instanceof DirectionalLight)
    expect(keyLight?.intensity).toBe(1.2)
    expect(keyLight?.target.parent).toBe(scene)
  })

  it('按原理图尺寸限制缩放范围并平滑计算缩放距离', () => {
    const range = schematicDistanceRange([16, 16, 16])

    expect(range.min).toBeGreaterThanOrEqual(1.5)
    expect(range.max).toBeGreaterThan(range.min)
    expect(schematicZoomDistance(range.min, -1000, range.min, range.max)).toBe(range.min)
    expect(schematicZoomDistance(range.max, 1000, range.min, range.max)).toBe(range.max)
    expect(schematicZoomDistance(10, 100, range.min, range.max)).toBeGreaterThan(10)
  })
})
