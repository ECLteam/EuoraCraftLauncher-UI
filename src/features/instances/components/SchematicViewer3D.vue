<template>
  <div ref="shellRef" class="schematic-viewer-shell">
    <canvas ref="canvasRef" class="schematic-viewer-canvas" />
    <div v-if="noBlocks" class="schematic-viewer-empty">{{ t('schematic.empty') }}</div>
    <div v-else class="schematic-viewer-info">{{ t('schematic.size', { x: size[0], y: size[1], z: size[2] }) }}</div>
    <div v-if="!noBlocks" class="schematic-viewer-toolbar">
      <NButtonGroup size="small">
        <NButton quaternary :title="t('schematic.rotateLeft')" @click="rotateModel(-1)"
          ><template #icon><UiIcon name="rotate-left" :size="17" /></template
        ></NButton>
        <NButton quaternary :title="t('schematic.rotateRight')" @click="rotateModel(1)"
          ><template #icon><UiIcon name="rotate-right" :size="17" /></template
        ></NButton>
        <NButton quaternary :title="t('schematic.resetView')" @click="resetView"
          ><template #icon><UiIcon name="refresh" :size="16" /></template
        ></NButton>
      </NButtonGroup>
      <div class="slice-control">
        <span>{{ t('schematic.sliceY') }}</span
        ><NSlider v-model:value="visibleLayers" :min="1" :max="Math.max(1, size[1] ?? 1)" :tooltip="false" /><NButton
          quaternary
          circle
          size="tiny"
          :title="t('schematic.showAll')"
          @click="showAll"
          ><template #icon><UiIcon name="layers" :size="15" /></template
        ></NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton, NButtonGroup, NSlider } from 'naive-ui'
import {
  BoxGeometry,
  Color,
  DirectionalLight,
  Group,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  type Texture,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import type { SchematicAssetsBundle, SchematicPreviewData } from '@/types/api'

const props = defineProps<{ data: SchematicPreviewData; assets: SchematicAssetsBundle | null }>()
const { t } = useI18n()
const shellRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const size = ref(props.data.size)
const visibleLayers = ref(Math.max(1, props.data.size[1] ?? 1))
const noBlocks = ref(false)
type Voxel = { position: Vector3; block: string; color: Color }
let voxels: Voxel[] = []
let renderer: WebGLRenderer | null = null
let camera: PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let scene: Scene | null = null
let root: Group | null = null
let frame = 0
let resizeObserver: ResizeObserver | null = null
let cameraDistance = 10
let disposed = false
const textures = new Map<string, Texture>()

function decodeVoxels(): Voxel[] {
  const output: Voxel[] = []
  for (const region of props.data.regions) {
    const [sx = 0, , sz = 0] = region.size
    const [px = 0, py = 0, pz = 0] = region.position
    for (let index = 0; index < region.indices.length; index += 1) {
      const paletteIndex = region.indices[index]
      const palette = paletteIndex === undefined ? undefined : region.palette[paletteIndex]
      if (!palette || palette.name.endsWith(':air') || !sx || !sz) continue
      const x = index % sx
      const remainder = Math.floor(index / sx)
      output.push({
        position: new Vector3(x + px, Math.floor(remainder / sz) + py, (remainder % sz) + pz),
        block: palette.name,
        color: new Color(
          (palette.color[0] ?? 128) / 255,
          (palette.color[1] ?? 128) / 255,
          (palette.color[2] ?? 128) / 255
        ),
      })
    }
  }
  return output
}

function modelReference(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (typeof record.model === 'string') return record.model
  for (const item of Object.values(record)) {
    const found = modelReference(item)
    if (found) return found
  }
  return null
}

function textureReference(block: string): string | null {
  const assets = props.assets
  if (!assets) return null
  const modelId = modelReference(assets.blockstates[block])
  if (!modelId) return null
  let current = modelId.includes(':') ? modelId : `minecraft:${modelId}`
  const visited = new Set<string>()
  while (!visited.has(current)) {
    visited.add(current)
    const model = assets.models[current]
    if (!model || typeof model !== 'object') return null
    const record = model as Record<string, unknown>
    const texture = Object.values((record.textures ?? {}) as Record<string, unknown>).find(
      (value): value is string => typeof value === 'string' && !value.startsWith('#')
    )
    if (texture) return texture.includes(':') ? texture : `minecraft:${texture}`
    if (typeof record.parent !== 'string') return null
    current = record.parent.includes(':') ? record.parent : `minecraft:${record.parent}`
  }
  return null
}

function textureForBlock(block: string): Texture | null {
  const id = textureReference(block)
  if (!id || !props.assets?.textures[id]) return null
  const cached = textures.get(id)
  if (cached) return cached
  const texture = new TextureLoader().load(`data:image/png;base64,${props.assets.textures[id]}`)
  texture.magFilter = 1003
  texture.minFilter = 1003
  textures.set(id, texture)
  return texture
}

function rebuildScene(): void {
  if (!root) return
  root.clear()
  const grouped = new Map<string, Voxel[]>()
  for (const voxel of voxels.filter((item) => item.position.y < visibleLayers.value))
    grouped.set(voxel.block, [...(grouped.get(voxel.block) ?? []), voxel])
  noBlocks.value = grouped.size === 0
  const half = new Vector3((size.value[0] ?? 0) / 2, ((size.value[1] ?? 0) - 1) / 2, (size.value[2] ?? 0) / 2)
  const geometry = new BoxGeometry(0.96, 0.96, 0.96)
  const matrix = new Matrix4()
  for (const [block, entries] of grouped) {
    const mesh = new InstancedMesh(
      geometry,
      new MeshStandardMaterial({
        map: textureForBlock(block),
        color: entries[0]?.color ?? new Color(0x888888),
        roughness: 0.9,
      }),
      entries.length
    )
    entries.forEach((voxel, index) => {
      matrix.makeTranslation(voxel.position.x - half.x, voxel.position.y - half.y, voxel.position.z - half.z)
      mesh.setMatrixAt(index, matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    root.add(mesh)
  }
}

function fitCamera(): void {
  if (!camera || !controls) return
  cameraDistance = (Math.max(...size.value) || 16) * 2.2
  camera.position.set(cameraDistance, cameraDistance * 0.7, cameraDistance)
  camera.near = Math.max(0.1, cameraDistance / 200)
  camera.far = cameraDistance * 200
  controls.target.set(0, 0, 0)
  controls.update()
}
function resize(): void {
  const bounds = shellRef.value?.getBoundingClientRect()
  if (!bounds || !renderer || !camera) return
  renderer.setSize(bounds.width, bounds.height)
  camera.aspect = bounds.width / bounds.height
  camera.updateProjectionMatrix()
}
function animate(): void {
  if (disposed) return
  frame = requestAnimationFrame(animate)
  controls?.update()
  if (renderer && scene && camera) renderer.render(scene, camera)
}
function rotateModel(direction: -1 | 1): void {
  if (root) root.rotation.y += direction * (Math.PI / 8)
}
function resetView(): void {
  fitCamera()
  root?.rotation.set(0, 0, 0)
}
function showAll(): void {
  visibleLayers.value = Math.max(1, size.value[1] ?? 1)
}
watch(visibleLayers, rebuildScene)

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  scene = new Scene()
  camera = new PerspectiveCamera(50, 1, 0.1, 2000)
  renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  const key = new DirectionalLight(0xffffff, 1.1)
  key.position.set(2, 4, 3)
  scene.add(key, new DirectionalLight(0xffffff, 0.45))
  root = new Group()
  scene.add(root)
  controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  voxels = decodeVoxels()
  fitCamera()
  rebuildScene()
  resize()
  resizeObserver = new ResizeObserver(resize)
  if (shellRef.value) resizeObserver.observe(shellRef.value)
  animate()
})
onBeforeUnmount(() => {
  disposed = true
  cancelAnimationFrame(frame)
  resizeObserver?.disconnect()
  controls?.dispose()
  renderer?.dispose()
  textures.forEach((texture) => texture.dispose())
})
</script>

<style scoped>
.schematic-viewer-shell {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 420px;
  overflow: hidden;
  background: var(--ecl-surface);
}
.schematic-viewer-canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}
.schematic-viewer-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--ecl-text-secondary, #999);
}
.schematic-viewer-info,
.schematic-viewer-toolbar {
  position: absolute;
  border: 1px solid color-mix(in srgb, var(--border-color, #333) 75%, transparent);
  background: color-mix(in srgb, var(--ecl-surface) 88%, transparent);
  backdrop-filter: blur(10px);
}
.schematic-viewer-info {
  top: 16px;
  left: 16px;
  padding: 5px 10px;
  border-radius: 8px;
  color: var(--ecl-text-secondary, #999);
  font-size: 12px;
}
.schematic-viewer-toolbar {
  right: 16px;
  bottom: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
  border-radius: 12px;
}
.slice-control {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 8px;
  color: var(--ecl-text-secondary, #999);
  font-size: 12px;
}
</style>
